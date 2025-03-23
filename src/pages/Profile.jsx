import React, { useState, useEffect, useRef } from "react";
import styled from "styled-components";
import axios from 'axios';
import { useParams, Link, useNavigate } from "react-router-dom";
import InfiniteScroll from "react-infinite-scroll-component";
import { LuDot } from "react-icons/lu";
import { getVideoList, convertDuration, convertTime, convertCount, getPlaylistitems } from "../utils/helpers";
import { CgPlayList } from "react-icons/cg";

const Wrapper=styled.div`
    position: absolute;
    top: 80px;
    left: ${(props)=>(props.isExpanded ? "210px":"90px")};
    width: ${(props) => (props.isExpanded ? "calc(100% - 210px)" : "calc(100% - 90px)")};
    height: calc(100vh - 80px);
    overflow-x: hidden;
    overflow-y: auto;
    /*I need to stress again that for infinite scroll component to work, you need to give scrollable target a fixed height
    and overflow-y: auto as its properties. overflow-y: auto enables us to scroll the page while fixed height tells infinite
    scroll component when the scroll bar reaches the bottom of the page and that's when next function should be called*/
`
const ProfileContainer=styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
`

const ChannelInfo=styled.div`
    display: flex;
    width: 80%;
    height: auto;
    gap: 20px;
    align-items: center;
`

const TextInfo=styled.div`
    display: flex;
    flex-direction: column;
    gap: 5px;
`

const Title=styled.div`
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
`

const DescriptionWrapper=styled.div`
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    border-radius: 12px;
    &: hover{
        cursor: pointer;
    }
`

const Banner=styled.div`
    width: 80%;
    height: 200px;
    background-image: url(${(props)=>props.channel[0].brandingSettings.image.bannerExternalUrl});
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    border-radius: 5px;
    margin-bottom: 10px;
`

const Options=styled.div`
    display: flex;
    justify-content: flex-start;
    width: 90%;
    height: 50px;
    gap: 10px;
    margin-top: 10px;
`

const Option=styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    border-bottom: ${(props) => (props.selectedType===props.index ? "2px solid white" : "none")};
    color: ${(props) => (props.selectedType===props.index ? "white" : "#7c7c7c")};
    width: 100px;
    font-weight: 600; /*semi-bold is not a valid css keyword. since 400 is normal size and 700 is bold, 600 is appropriate for "semi-bold"*/
    &:hover {
        cursor: pointer;
    }
`

const GridContainer=styled.div`
    display: grid;
    grid-template-columns: ${(props)=>(props.isExpanded ? "repeat(auto-fit, minmax(200px, 1fr))":"repeat(auto-fit, minmax(280px, 1fr))")};
    /*this is the most elegant usage of grid---auto-fit will try to add as many columns as possible in one line while 360px will make sure
    the minimal width of each column is 360px and auto-fit will wrap overflown items into new line. in this case the final width of each item
    is determined by the maximal number of columns. say there are 6 items in total and 2 of them are wrapped into new line then the width of
    grid item is determined by the first line(by dividing the entire row space into 4 equal columns)*/
    column-gap: 16px;
    row-gap: 30px;
    width: 100%;
    margin-top: 20px;
    height: auto;
`

const Card=styled.div`
    width:100%;
    aspect-ratio:1/1;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap:5px;
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
`

const Videocount=styled.div`
    position: absolute;
    border-radius: 10px;
    background-color: #0c0c0ccc;
    bottom: 5px;
    right: 5px;
    padding: 5px 5px 5px 5px;
    display: flex;
    gap: 5px;
`

const Duration=styled.div`
    position: absolute;
    border-radius: 10px;
    background-color: #0c0c0ccc;
    bottom: 5px;
    right: 5px;
    padding: 5px 5px 5px 5px;
`

const Details=styled.div`
    display: flex;
    flex-direction: column;
    width:100%;
    aspect-ratio:2/1;
    background-color: #0c0c0c;
    gap: 5px;
    align-items: flex-start;
`

function Profile({isExpanded}){
    const {channelId}=useParams();
    const API_Key=import.meta.env.VITE_YOUTUBE_API_KEY;
    const [channel, setChannel]=useState(null);
    const [selectedType, setSelectedType]=useState(0);//default selected type is Videos
    const [videos, setVideos]=useState([]);
    const [playlist, setPlaylist]=useState(null);
    const [playlists, setPlaylists]=useState([]);
    const [nextPageToken, setNextPageToken] = useState(null);//page token for getPlaylistitems
    const types=["Videos","Playlists"];
    const navigate=useNavigate();

    useEffect(()=>{
        setVideos([]);
        setPlaylists([]);
        setNextPageToken(null);
        if (selectedType==0){
            getChannel();
        }
        if (selectedType==1){
            setPlaylist(null);//without this, when you switch from playlists to videos there will be no videos displayed because state playlist hasn't changed at all
            getPlaylists();
        }
    }, [selectedType]);

    useEffect(()=>{
        if (playlist){//avoid triggering getplaylistitems when the page is first loaded
            if (selectedType==1){
                getPlaylistitems(playlist, null, null, videos, setVideos);
                /*we only care about the videoId of the first video in the playlist(required by navigate) so there is no need to pass and set nextPageToken
                , which means nextPageToken will remain as how it's been set in getPlaylists before profile page is replaced by watch page*/
            }else{
                getPlaylistitems(playlist, nextPageToken, setNextPageToken, videos, setVideos);
            }
        }
    }, [playlist]);

    useEffect(() => {
        if (selectedType == 1 && videos.length > 0) {//when you click on a playlist, you will be directed to the first video in the playlist
            console.log("playlist id is", playlist);
            navigate(`/watch/${videos[0].id}`, {state: {showPlaylist: true, playlist}});//use together with useLocation in Watch page
        }
    }, [videos]);
    //can't just put navigate inside the previous useEffect because setVideos in getPlaylistitems is asynchronous so that you can't guarantee
    //that by the time you try to navigate to watch page the videos has already been set up

    function getChannel(){
        axios.get(`https://www.googleapis.com/youtube/v3/channels?key=${API_Key}&part=snippet,brandingSettings,contentDetails,statistics&id=${channelId}`)
        .then((response) => {
            //console.log("channel is:", response);
            const data=response.data;
            setChannel(data.items);
            setPlaylist(data.items[0].contentDetails.relatedPlaylists.uploads);
            /*this is the id for default playlist called uploads. this playlist is created by youtube while other playlists are created
            by the channel/user. default playlist is not shown directly under playlists option in a youtube channel but it contains 
            all videos uploaded by this channel*/

        })
        .catch((error) => console.error(error));
    }

    function getPlaylists(){
        const params={
            key: API_Key,
            part: "snippet,contentDetails",
            channelId: channelId,
            maxResults: 12,
            pageToken: nextPageToken || ''
        }
        axios.get("https://www.googleapis.com/youtube/v3/playlists", {params})
        .then((response) => {
            //console.log("playlists are:", response);
            setPlaylists((prevPlaylists) => [...(prevPlaylists||[]), ...response.data.items]);
            setNextPageToken(response.data.nextPageToken || null);
        })
        .catch((error) => console.error(error));
    }
    //for every playlist you need to call getPlaylistitems

    return(
        <Wrapper isExpanded={isExpanded} id="scrollable-container">
            {channel && 
                <ProfileContainer>
                    <Banner channel={channel}></Banner>
                    <ChannelInfo>
                        <img src={channel[0].snippet.thumbnails.high.url} style={{width:"100px", height:"100px", borderRadius:"50%"}} alt="error"></img>
                        <TextInfo>
                            <div style={{fontSize:"36px", fontWeight:"bold"}}>{channel[0].brandingSettings.channel.title}</div>
                            <div style={{display:"flex"}}>
                                <div style={{color:"#d0d0d0"}}>{convertCount(channel[0].statistics.subscriberCount)} subscribers</div>
                                <LuDot style={{color:"#d0d0d0"}}></LuDot>
                                <div style={{color:"#d0d0d0"}}>{convertCount(channel[0].statistics.videoCount)} videos</div>
                            </div>
                            <DescriptionWrapper>
                                <div>
                                    {channel[0].brandingSettings.channel.description}
                                </div>
                            </DescriptionWrapper>
                        </TextInfo>
                    </ChannelInfo>
                    <Options>
                        {types.map((type,index)=>(
                            <Option selectedType={selectedType} index={index} key={index} onClick={()=>setSelectedType(index)}>{type}</Option>
                        ))}
                    </Options>
                    <hr style={{border:"1px", borderColor:"#7c7c7c", borderStyle:"solid", width:"100%", margin:"0px"}}></hr>
                    {videos.length!==0 && selectedType===0 &&
                        <div style={{width:"90%"}}>
                        {/*
                            this div is necessary because we need to give grid component a width property to make it work and as we know
                            infinite scroll component will generate an implicit outer div that we can't directly manipulate
                            so we need to create a wrapper to set width property
                        */}
                            <InfiniteScroll
                                dataLength={videos.length} // Length of the current project list
                                next={()=>{
                                    //prevVideos.current=videos;//don't forget to preserve the previous video list in the prevVideos
                                    getPlaylistitems(playlist, nextPageToken, setNextPageToken, videos, setVideos);
                                }} // Function to fetch more data
                                hasMore={!!nextPageToken} // Boolean flag for fetching more data
                                isExpanded={isExpanded}
                                key={selectedType}
                                /*the function of the key here is to reset the position of scroll bar when category changes. otherwise you will find
                                the scroll bar will stay at previous position even though category has changed and page has been reloaded. the reason
                                is that react treats the same components with different key as different instances so it will be re-rendered*/
                                scrollableTarget="scrollable-container"
                            >
                                <GridContainer isExpanded={isExpanded}>
                                    {videos.map((item,index)=>(                                        
                                        <Link to={`/watch/${item.id}`} key={index} style={{textDecoration: "none", color: "white"}}>
                                            <Card>
                                                <Thumbnail>
                                                    <img src={item.snippet.thumbnails.standard.url} style={{borderRadius:"12px", width:"100%", height:"100%", objectFit:"cover", objectPosition:"center"}} alt="error"></img>
                                                    <Duration>{convertDuration(item.contentDetails?.duration)}</Duration>
                                                </Thumbnail>
                                                <Details>
                                                    <Title>{item.snippet.title}</Title>
                                                    <div>
                                                        <span>{`${convertCount(item.statistics.viewCount)} views`}</span>
                                                        <LuDot></LuDot>
                                                        <span>{convertTime(item.snippet.publishedAt)}</span>
                                                    </div>   
                                                </Details>
                                            </Card>
                                        </Link>                                           
                                    ))}
                                </GridContainer>
                            </InfiniteScroll>
                        </div>
                    }
                    {playlists.length!==0 && selectedType===1 &&
                        <div style={{width:"90%"}}>
                        {/*
                            this div is necessary because we need to give grid component a width property to make it work and as we know
                            infinite scroll component will generate an implicit outer div that we can't directly manipulate
                            so we need to create a wrapper to set width property
                        */}
                            <InfiniteScroll
                                dataLength={playlists.length} // Length of the current project list
                                next={()=>{
                                    //prevVideos.current=videos;//don't forget to preserve the previous video list in the prevVideos
                                    getPlaylists();
                                }} // Function to fetch more data
                                hasMore={!!nextPageToken} // Boolean flag for fetching more data
                                isExpanded={isExpanded}
                                key={selectedType}
                                /*the function of the key here is to reset the position of scroll bar when category changes. otherwise you will find
                                the scroll bar will stay at previous position even though category has changed and page has been reloaded. the reason
                                is that react treats the same components with different key as different instances so it will be re-rendered*/
                                scrollableTarget="scrollable-container"
                            >
                                <GridContainer isExpanded={isExpanded}>
                                    {playlists.map((item,index)=>(                                          
                                        <Card key={index} onClick={()=>setPlaylist(item.id)}>
                                            <Thumbnail>
                                                <img src={item.snippet.thumbnails.standard?.url} style={{width:"100%", height:"100%", borderRadius:"12px", objectFit:"cover", objectPosition:"center"}} alt="error"></img>
                                                <Videocount>
                                                    <CgPlayList size="20px"></CgPlayList>
                                                    <div style={{fontSize:"14px"}}>{`${item.contentDetails.itemCount} videos`}</div>
                                                </Videocount>
                                            </Thumbnail>
                                            <Title>{item.snippet.title}</Title>  
                                        </Card>                                           
                                    ))}
                                </GridContainer>
                            </InfiniteScroll>
                        </div>
                    }
                </ProfileContainer>
            }    
        </Wrapper>
    )
}

export default Profile;