import React, {useState, useEffect} from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";
import styled from "styled-components";
import { Link } from "react-router-dom";
import InfiniteScroll from "react-infinite-scroll-component";
import { getVideoList, convertDuration, convertTime, convertCount } from "../utils/helpers";
import { LuDot } from "react-icons/lu";

const SearchContainer=styled.div`
    position: absolute;
    top: 85px;
    left: ${(props)=>(props.isExpanded ? "210px":"90px")};
    right: 60px;
    width: ${(props) => (props.isExpanded ? "calc(100vw - 270px)" : "calc(100vw - 150px)")};
    height: calc(100vh - 85px);
    display: flex;
    flex-direction: column;
    gap: 10px;
`

const Card=styled.div`
    width:100%;
    height: auto;
    border-radius: 10px;
    display: flex;
    align-items: flex-start;
    justify-content: flex-start;
    gap:20px;
`

const Thumbnail=styled.div`
    position: relative;
    border-radius: 12px;
    width:100%;
    aspect-ratio:16/9;
    overflow: hidden;
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
    gap: 16px;
`

function Search({isExpanded}){
    const [searchParams]=useSearchParams();
    //like useState() useSearchParams() also returns an array of length 2. in this case we don't need the setter so searchParams will receive the first item in the array
    const queryParams=searchParams.get("query");
    const [nextPageToken, setNextPageToken] = useState(null);
    const [videos, setVideos] = useState([]);
    const API_Key=import.meta.env.VITE_YOUTUBE_API_KEY;

    useEffect(()=>{
        setVideos([]);
        setNextPageToken(null);
        getSearchedVideos();
    },[queryParams]);//when the queryParams changes, refresh the search page with the latest searched results

    function getSearchedVideos() {
        const params = {
            key: API_Key,
            part: 'snippet',
            q: queryParams,
            maxResults: 5,
            pageToken: nextPageToken
        };
    
        axios.get('https://www.googleapis.com/youtube/v3/search', { params })
        .then((response) => {
            console.log("search results are: ",response);
            setNextPageToken(response.data.nextPageToken || null);
            const videoIdArray=response.data.items.map((item,index)=>(item.id.videoId));
            const videoIdString=videoIdArray.join(',');
            getVideoList(null, videoIdString, null, null, videos, setVideos);
        })
        .catch((error) => console.error(error));
    }

    return(
        <>
            {videos.length!==0 && 
                <InfiniteScroll
                    dataLength={videos.length} // Length of the current project list
                    next={()=>{
                        //prevVideos.current=videos;//don't forget to preserve the previous video list in the prevVideos
                        getVideoList(null, null, nextPageToken, setNextPageToken, videos, setVideos)
                    }} // Function to fetch more data
                    hasMore={!!nextPageToken} // Boolean flag for fetching more data
                    isExpanded={isExpanded}
                    /*the function of the key here is to reset the position of scroll bar when category changes. otherwise you will find
                    the scroll bar will stay at previous position even though category has changed and page has been reloaded. the reason
                    is that react treats the same components with different key as different instances so it will be re-rendered*/
                >
                    <SearchContainer isExpanded={isExpanded}> 
                        {videos.map((item,index)=>(
                            <Link to={`/watch/${item.id}`} key={index} style={{textDecoration: "none", color: "white"}}>
                                <Card>
                                    <Thumbnail>
                                        <img src={item.snippet.thumbnails.standard.url} style={{width:"100%", height:"100%", objectFit:"cover", objectPosition:"center"}} alt="error"></img>
                                        <Duration>{convertDuration(item.contentDetails.duration)}</Duration>
                                    </Thumbnail>
                                    <Details>
                                        <div style={{fontSize:"18px"}}>{item.snippet.title}</div>
                                        <div style={{display:"flex", gap:"10px", alignItems:"center"}}>
                                            <Link to={`/profile/${item.snippet.channelId}`} onClick={(e) => e.stopPropagation()}>
                                            {/*
                                                stopPropagation will prevent the click event bubbling up to the outer link. otherwise it will jump to
                                                watch page instead of profile page
                                            */}
                                                <img src={item.channelThumbnail} style={{width:"40px", height:"40px", borderRadius:"50%"}} alt="error"></img>
                                            </Link>
                                            <div style={{color:"#d0d0d0", fontSize:"16px"}}>{item.snippet.channelTitle}</div>
                                        </div>
                                        <div style={{color:"#d0d0d0", fontSize:"16px"}}>
                                            <span>{`${convertCount(item.statistics.viewCount)} views`}</span>
                                            <LuDot></LuDot>
                                            <span>{convertTime(item.snippet.publishedAt)}</span>
                                        </div>
                                    </Details>
                                </Card>
                            </Link>
                        ))}
                    </SearchContainer>
                </InfiniteScroll>
            }
        </>
    )
}

export default Search;