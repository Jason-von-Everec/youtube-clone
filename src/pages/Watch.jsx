import React, {useState, useEffect} from "react";
import styled from "styled-components";
import { BiLike } from "react-icons/bi";
import { FaShare } from "react-icons/fa";
import {useParams, useLocation} from "react-router-dom";
import { getVideoList, convertDuration, convertTime, convertCount, getPlaylistitems } from "../utils/helpers";
import axios from "axios";
import InfiniteScroll from "react-infinite-scroll-component";
import { Link } from "react-router-dom";
import { IoIosArrowDown } from "react-icons/io";
import { IoIosArrowUp } from "react-icons/io";
import { LuDot } from "react-icons/lu";
import { IoClose } from "react-icons/io5";

const WatchContainer=styled.div`
    display: flex;
    position: absolute;
    top: 80px;
    left: ${(props)=>(props.isExpanded ? "210px":"90px")};
    width: ${(props) => (props.isExpanded ? "calc(100% - 210px)" : "calc(100% - 90px)")};
    height: calc(100vh - 80px);
    gap:10px;
    overflow-y: auto;
    overflow-x: hidden;
    /*
    if you want to control the scrolling event of two infinite scroll components using one main container at the same time, you need to
    give this main container a fixed height, overflow-y: auto properties and don't forget to make it the scrollableTarget of both components
    */
`

const LeftColumn=styled.div`
    flex: 1.6;
    height: auto;
    width: auto;
    display: flex;
    flex-direction: column;
    gap: 10px;
`

const RightColumn=styled.div`
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-right: 5%;
`

const RecommendedVideos=styled.div`
    height: auto;
    display: flex;
    flex-direction:column;
    gap:10px;
    width: 100%;
`

const MiniCard=styled.div`
    display: flex;
    width: 100%;
    gap: 10px;
    align-items: center;
`

const MiniDetails=styled.div`
    flex:1;
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 5px;
    align-self: flex-start;
    /*by using align-self you can override align-items for this particular flex item*/
`
const Title=styled.div`
    font-size: 20px;
    height: auto;
    width: 100%;
`

const ChannelInfo=styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    height: 60px;
`

const InfoLeft=styled.div`
    width: auto;
    height: 60px;
    display: flex;
    gap: 10px;
`

const InfoRight=styled.div`
    width: auto;
    height: 60px;
    display: flex;
    gap: 12px;
    align-items: center;
`

const CommentZone=styled.div`
    width: 100%;
    height: auto;
    display: flex;
    flex-direction: column;
    gap: 10px;
`

const Comment=styled.div`
    display: flex;
    gap: 15px;
    height: auto;
    /*height: auto will only determined by non-positioned children*/
`

const CommentInfo=styled.div`
    display: flex;
    flex-direction: column;
    gap: 5px;
    height: 100%;
`

const Replies=styled.div`
    display: flex;
    flex-direction: column;
    height: auto;
`

const Like=styled.div`
    display: flex;
    gap: 5px;
    align-items: center;
`
const CustomButton=styled.div`
    background-color: #2e2c2b;
    &: hover{
        cursor: pointer;
        background-color: #484645;
    }
    border-radius: 30px;
    padding: 8px 20px 8px 20px;
    display: flex;
    width: auto;
    height: 40px;
    gap: 10px;
    align-items: center;
`

const ButtonText=styled.div`
    font-size: 16px;
`

const Description=styled.div`
    line-height: 20px;
    max-height: ${(props)=>(props.showDescription? "auto":"60px")};
    overflow: hidden;
`

const DescriptionWrapper=styled.div`
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    background-color: #2e2c2b;
    border-radius: 12px;
    &: hover{
        cursor: pointer;
    }
    padding: 10px;
`

const Duration=styled.div`
    position: absolute;
    border-radius: 10px;
    background-color: #0c0c0ccc;
    bottom: 5px;
    right: 5px;
    padding: 5px 5px 5px 5px;
`

const Thumbnail=styled.div`
    position: relative;
    width:100%;
    aspect-ratio:16/9;
    overflow: hidden;
    /*remember that if you want to make the image inside thumbnail div cover the whole space you need to set overflow: hidden for the container
    and object-fit: cover for the image at the same time. the latter one will scale(down in this case) the image to fit the container while
    keeping its aspect ratio(object-fit must be used with width: 100%, height: 100%). without object-fit: cover the image with be stretched or
    compressed. the former will clip the black stripes*/
    flex: 1;
`

const ArrowButton=styled.div`
    display:flex;
    color: #3ca2f9;
    gap: 5px;
    align-items: center;
    margin-top: 5px;
    margin-bottom: 5px;
`

const Playlist=styled.div`
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 400px;
    border-radius: 10px;
    border-width: 1px;
    border-color: white;
    border-style: solid;/*if you omit border-style then the border won't show up even with all these properties defined above*/
`

const UpperPlaylist=styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    height: 100px;
    background-color: #212121;
    border-top-left-radius: 10px;
    border-top-right-radius: 10px;
`

const LowerPlaylist=styled.div`
    display: flex;
    flex-direction: column;
    height: 300px;
    overflow-y: auto;
    gap: 10px;
`

function Watch({isExpanded}){
    const [showDescription, setShowDescription]=useState(false);
    const {videoId}=useParams();//the name here must align with the parameter name in route
    const location=useLocation();
    const fromPlaylist=location.state?.showPlaylist || false;//default to false if we are not from playlists option in profile page
    const playlistId=location.state?.playlist;
    const [video, setVideo] = useState(null);
    const [relatedVideos, setRelatedVideos]=useState([]);
    const [playlistVideos, setPlaylistVideos]=useState([]);
    const API_Key=import.meta.env.VITE_YOUTUBE_API_KEY;
    const [nextPageTokenRelatedVideos, setNextPageTokenRelatedVideos]=useState(null);
    const [nextPageTokenPlaylistVideos, setNextPageTokenPlaylistVideos]=useState(null);
    const [nextPageTokenComments, setNextPageTokenComments]=useState(null);
    const [comments, setComments]=useState([]);
    const [isReplyVisible, setIsReplyVisible]=useState([]);
    const [showPlaylist, setShowPlaylist]=useState(true);
    const [playlist, setPlaylist]=useState(null);

    useEffect(()=>{
        setVideo(null);
        setNextPageTokenRelatedVideos(null);
        setNextPageTokenComments(null);
        getVideoList(null, videoId, null, null, video, setVideo);
        getComments();
        if (fromPlaylist){
            getPlaylist();
        }
    }, []);

    useEffect(()=>{
        if (video){
            if(video[0].snippet.tags){
                getRelatedVideos();
            }
        }
    }, [video]);

    useEffect(()=>{
        if (playlist){//avoid triggering getplaylistitems when the page is first loaded
            getPlaylistitems(playlistId, nextPageTokenPlaylistVideos, setNextPageTokenPlaylistVideos, playlistVideos, setPlaylistVideos);
        }
    }, [playlist]);
    
    function getRelatedVideos() {
        const tags=video[0].snippet.tags;
        const tagString=tags.join("%7C");
        const params = {
            key: API_Key,
            part: 'snippet',
            q: tagString,
            maxResults: 5,
            pageToken: nextPageTokenRelatedVideos
        };
    
        axios.get('https://www.googleapis.com/youtube/v3/search', { params })
        .then((response) => {
            //console.log("related videos are: ",response);
            //setRelatedVideos((prevRelatedVideos) => [...prevRelatedVideos, ...response.data.items]);
            setNextPageTokenRelatedVideos(response.data.nextPageToken || null);
            const videoIdArray=response.data.items.map((item,index)=>(item.id.videoId));
            const videoIdString=videoIdArray.join(',');
            getVideoList(null, videoIdString, null, null, relatedVideos, setRelatedVideos);
        })
        .catch((error) => console.error(error));
    }

    function getComments(){
        axios.get(`https://www.googleapis.com/youtube/v3/commentThreads?key=${API_Key}&part=snippet,replies&videoId=${videoId}`)
        .then((response)=>{
            //console.log("comments are: ", response);
            if (nextPageTokenComments!==null){
                setNextPageTokenComments(data.nextPageTokenComments || null);//if there are no more page, nextPageToken field will not appear in the response
            }
            const newComments=response.data.items;
            setComments((prevComments) => [...(prevComments||[]), ...newComments]);
            setIsReplyVisible((prevState)=>[...(prevState||[]), ...newComments.map((item,index)=>(false))]);
        })
        .catch((error)=>console.error(error));
    }

    function getPlaylist(){
        const params={
            key: API_Key,
            part: "snippet,contentDetails",
            id: playlistId
        }
        axios.get("https://www.googleapis.com/youtube/v3/playlists", {params})
        .then((response) => {
            console.log("playlist is:", response);
            setPlaylist(response.data.items);
        })
        .catch((error) => console.error(error));
    }

    return (
        <WatchContainer isExpanded={isExpanded} id="scrollable-container">{/*here must use id instead of class*/}
            {video && //it's important to make sure video is fully set up before retrieve properties from it otherwise you'll get read properties from undefined error
                <LeftColumn>
                    <iframe src={`https://www.youtube.com/embed/${videoId}?autoplay=1`} 
                            style={{width:"100%", aspectRatio:"16/9", border:"0px", borderRadius:"10px"}}
                            allow="autoplay"
                            allowFullScreen
                    >
                        {/*autoplay=1 is required by youtube while allow="autoplay" is required by the browser so both of them are indispensable for autoplaying video*/}
                    </iframe>
                    <Title>{video[0].snippet.title}</Title>{/*don't forget video is an array although in this case it only has one object*/}
                    <ChannelInfo>
                        <InfoLeft>
                            <Link to={`/profile/${video[0].snippet.channelId}`}>
                                <img src={video[0].channelThumbnail} style={{width:"40px", height:"40px", borderRadius:"50%"}} alt="error"></img>
                            </Link>
                            <div>
                                <div>{video[0].snippet.channelTitle}</div>
                                <div>{`${convertCount(video[0].subscriberCount)} subscribers`}</div>
                            </div>
                        </InfoLeft>
                        <InfoRight>
                            <CustomButton>
                                <BiLike size="24px"></BiLike>
                                <ButtonText>{convertCount(video[0].statistics.likeCount)}</ButtonText>
                            </CustomButton>
                            <CustomButton>
                                <FaShare size="24px"></FaShare>
                                <ButtonText>share</ButtonText>
                            </CustomButton>
                        </InfoRight>
                    </ChannelInfo>
                    <DescriptionWrapper>
                        <Description showDescription={showDescription} onClick={()=>{
                            if (!showDescription){
                                setShowDescription(true);
                            }
                        }}>
                            {video[0].snippet.description}
                        </Description>
                        {showDescription==false && <div onClick={()=>setShowDescription(true)}>...more</div>}
                        {showDescription==true && <div onClick={()=>setShowDescription(false)}>Show less</div>}
                    </DescriptionWrapper>
                    {comments.length!==0 && 
                        <div>
                            <InfiniteScroll
                                dataLength={comments.length} // Length of the current project list
                                next={()=>getComments()} // Function to fetch more data
                                hasMore={!!nextPageTokenComments} // Boolean flag for fetching more data
                                //loader={<h4>Loading...</h4>} // Show loader when fetching more data
                                //endMessage={<p>You have reached the bottom.</p>} // Message when no more data
                                isExpanded={isExpanded}
                                scrollableTarget="scrollable-container"
                            >
                                <CommentZone>
                                    {comments.map((item,index)=>{
                                        const hasReplies=item.replies? true:false;
                                        const showReplies=isReplyVisible[index];
                                        return(
                                            <Comment key={index}>
                                                <img src={item.snippet.topLevelComment.snippet.authorProfileImageUrl} style={{width:"40px", height:"40px", borderRadius:"50%"}} alt="error"></img>
                                                <CommentInfo>
                                                    <div>{item.snippet.topLevelComment.snippet.authorDisplayName}</div>
                                                    <div>{item.snippet.topLevelComment.snippet.textDisplay}</div>
                                                    <Like>
                                                        <BiLike></BiLike>
                                                        <div>{convertCount(item.snippet.topLevelComment.snippet.likeCount)}</div>
                                                    </Like>
                                                    {hasReplies && !showReplies &&
                                                        <ArrowButton onClick={()=>setIsReplyVisible((prevState)=>{
                                                            const newState=[...prevState];
                                                            newState[index]=!newState[index];
                                                            return newState;
                                                        })}>
                                                            <IoIosArrowDown></IoIosArrowDown>
                                                            <div>{`${item.replies.comments.length} replies`}</div>
                                                        </ArrowButton>    
                                                    }
                                                    {hasReplies && showReplies &&
                                                        <ArrowButton onClick={()=>setIsReplyVisible((prevState)=>{
                                                            const newState=[...prevState];
                                                            newState[index]=!newState[index];
                                                            return newState;
                                                        })}>
                                                            <IoIosArrowUp></IoIosArrowUp>
                                                            <div>{`${item.replies.comments.length} replies`}</div>
                                                        </ArrowButton>    
                                                    }
                                                    {showReplies &&
                                                        <Replies>
                                                            {
                                                                item.replies.comments.map((reply,key)=>(
                                                                    <Comment key={key}>
                                                                        <img src={reply.snippet.authorProfileImageUrl} style={{width:"40px", height:"40px", borderRadius:"50%"}} alt="error"></img>
                                                                        <CommentInfo>
                                                                            <div>{reply.snippet.authorDisplayName}</div>
                                                                            <div>{reply.snippet.textDisplay}</div>
                                                                            <Like>
                                                                                <BiLike></BiLike>
                                                                                <div>{convertCount(reply.snippet.likeCount)}</div>
                                                                            </Like>
                                                                        </CommentInfo>
                                                                    </Comment>
                                                                ))
                                                            }
                                                        </Replies>
                                                    }
                                                </CommentInfo>
                                            </Comment>
                                        )
                                    })}
                                </CommentZone>
                            </InfiniteScroll>
                        </div>
                    }
                </LeftColumn>
            }
            <RightColumn>
                {showPlaylist && fromPlaylist && playlist &&
                    <Playlist>
                        <UpperPlaylist>
                            <div style={{marginLeft:"30px"}}>{playlist[0].snippet.title}</div>
                            <IoClose size="28px" onClick={()=>setShowPlaylist(false)} style={{marginRight:"10px"}}></IoClose>
                            {/*don't forget to wrap set state in a callback or showPlaylist will be set to false immediately when the page is rendered*/}
                        </UpperPlaylist>
                        {playlistVideos.length!==0 &&
                            <InfiniteScroll
                                dataLength={playlistVideos.length} // Length of the current project list
                                next={()=>getPlaylistitems(playlistId, nextPageTokenPlaylistVideos, setNextPageTokenPlaylistVideos, playlistVideos, setPlaylistVideos)} // Function to fetch more data
                                hasMore={!!nextPageTokenPlaylistVideos} // Boolean flag for fetching more data
                                isExpanded={isExpanded}
                                scrollableTarget="playlist"
                            >
                                <LowerPlaylist id="playlist">
                                    {playlistVideos.map((item,index)=>(
                                        <Link to={`/watch/${item.id}`} key={index} style={{textDecoration: "none", color: "white"}}/*textDecoration here is used to remove the underline*/>
                                            <MiniCard>
                                                <div style={{marginLeft:"10px"}}>{index+1}</div>
                                                <Thumbnail>
                                                    <img src={item.snippet.thumbnails.standard?.url} style={{borderRadius:"12px", width:"100%", height:"100%", objectFit:"cover", objectPosition:"center"}} alt="error"></img>
                                                    <Duration>{convertDuration(item.contentDetails?.duration)}</Duration>
                                                </Thumbnail>
                                                <MiniDetails>
                                                    <div style={{lineHeight: "16px", maxHeight: "32px", overflow:"hidden", textOverflow:"ellipsis"}}>{item.snippet.title}</div>
                                                    {/*the style above trys to limit the title to 2 lines and cuts out the overflown part*/}
                                                    <div style={{color: "#747474", fontSize:"12px", fontWeight:"bold"}}>{item.snippet.channelTitle}</div>
                                                    <div style={{color: "#747474", fontSize:"12px", fontWeight:"bold"}}>
                                                        <span>{`${convertCount(item.statistics.viewCount)} views`}</span>
                                                        <LuDot></LuDot>
                                                        <span>{convertTime(item.snippet.publishedAt)}</span>
                                                    </div>
                                                </MiniDetails>
                                            </MiniCard>
                                        </Link>
                                    ))}     
                                </LowerPlaylist>                   
                            </InfiniteScroll>
                        }
                    </Playlist>
                }
                {relatedVideos.length!==0 &&
                    <InfiniteScroll
                        dataLength={relatedVideos.length} // Length of the current project list
                        next={()=>getRelatedVideos()} // Function to fetch more data
                        hasMore={!!nextPageTokenRelatedVideos} // Boolean flag for fetching more data
                        isExpanded={isExpanded}
                        scrollableTarget="scrollable-container"
                    >
                        <RecommendedVideos>
                            {relatedVideos.map((item,index)=>(
                                <Link to={`/watch/${item.id.videoId}`} key={index} style={{textDecoration: "none", color: "white"}}/*textDecoration here is used to remove the underline*/>
                                    <MiniCard>
                                        <Thumbnail>
                                            <img src={item.snippet.thumbnails.standard?.url} style={{borderRadius:"12px", width:"100%", height:"100%", objectFit:"cover", objectPosition:"center"}} alt="error"></img>
                                            <Duration>{convertDuration(item.contentDetails?.duration)}</Duration>
                                        </Thumbnail>
                                        <MiniDetails>
                                            <div style={{lineHeight: "16px", maxHeight: "32px", overflow:"hidden", textOverflow:"ellipsis"}}>{item.snippet.title}</div>
                                            {/*the style above trys to limit the title to 2 lines and cuts out the overflown part*/}
                                            <div style={{color: "#747474", fontSize:"12px", fontWeight:"bold"}}>{item.snippet.channelTitle}</div>
                                            <div style={{color: "#747474", fontSize:"12px", fontWeight:"bold"}}>
                                                <span>{`${convertCount(item.statistics.viewCount)} views`}</span>
                                                <LuDot></LuDot>
                                                <span>{convertTime(item.snippet.publishedAt)}</span>
                                            </div>
                                        </MiniDetails>
                                    </MiniCard>
                                </Link>
                            ))}                        
                        </RecommendedVideos>
                    </InfiniteScroll>            
                }
            </RightColumn>
        </WatchContainer>
    )
}

export default Watch;