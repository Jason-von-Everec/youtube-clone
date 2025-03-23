import React, {useState, useEffect, useRef} from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import { getVideoList, convertDuration, convertTime, convertCount } from "../utils/helpers";
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { LuDot } from "react-icons/lu";

const GridContainer=styled.div`
    display: grid;
    grid-template-columns: ${(props)=>(props.isExpanded ? "repeat(auto-fit, minmax(280px, 1fr))":"repeat(auto-fit, minmax(360px, 1fr))")};
    /*this is the most elegant usage of grid---auto-fit will try to add as many columns as possible in one line while 360px will make sure
    the minimal width of each column is 360px and auto-fit will wrap overflown items into new line. in this case the final width of each item
    is determined by the maximal number of columns. say there are 6 items in total and 2 of them are wrapped into new line then the width of
    grid item is determined by the first line(by dividing the entire row space into 4 equal columns)*/
    column-gap: 16px;
    row-gap: 30px;
    position: absolute;
    top: 85px;
    left: ${(props)=>(props.isExpanded ? "210px":"90px")};
    right: 60px;
    width: ${(props) => (props.isExpanded ? "calc(100vw - 270px)" : "calc(100vw - 150px)")};
    height: calc(100vh - 85px);
`

const Card=styled.div`
    width:100%;
    aspect-ratio:1/1;
    border-radius: 10px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap:5px;
`

const Thumbnail=styled.div`
    position: relative;
    border-radius: 12px;
    width:100%;
    aspect-ratio:16/9;
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
    width:100%;
    aspect-ratio:2/1;
    background-color: #0c0c0c;
    gap: 16px;
`

const Description=styled.div`
    display:flex;
    flex-direction:column;
`

function Home({isExpanded, categoryId}){
    
    const [videos, setVideos] = useState([]);
    //let prevVideos=[];
    //const prevVideos=useRef([]);
    /*it's better to use useRef than normal variable because theoretically normal variable will be reset to empty array
    on every re-render and you will lose data for previous fetched videos. on the contrary, useRef and useState will be kept and remembered 
    among re-renders. however, setting useRef is synchronous and won't cause re-render, which is different from useState*/
    const [nextPageToken, setNextPageToken] = useState(null);

    useEffect(()=>{
        setVideos([]);
        //prevVideos.current=[];
        setNextPageToken(null);
        getVideoList(categoryId, null, nextPageToken, setNextPageToken, videos, setVideos);
    }, [categoryId]);

    return(
        <>
            {videos.length!==0 && 
                <InfiniteScroll
                    dataLength={videos.length} // Length of the current project list
                    next={()=>{
                        //prevVideos.current=videos;//don't forget to preserve the previous video list in the prevVideos
                        getVideoList(categoryId, null, nextPageToken, setNextPageToken, videos, setVideos)
                    }} // Function to fetch more data
                    hasMore={!!nextPageToken} // Boolean flag for fetching more data
                    isExpanded={isExpanded}
                    key={categoryId}
                    /*the function of the key here is to reset the position of scroll bar when category changes. otherwise you will find
                    the scroll bar will stay at previous position even though category has changed and page has been reloaded. the reason
                    is that react treats the same components with different key as different instances so it will be re-rendered*/
                >
                    <GridContainer isExpanded={isExpanded}> 
                        {videos.map((item,index)=>(
                            <Link to={`/watch/${item.id}`} key={index} style={{textDecoration: "none", color: "white"}}>
                                <Card>
                                    <Thumbnail>
                                        <img src={item.snippet.thumbnails.standard.url} style={{width:"100%", height:"100%"}} alt="error"></img>
                                        <Duration>{convertDuration(item.contentDetails.duration)}</Duration>
                                    </Thumbnail>
                                    <Details>
                                        <Link to={`/profile/${item.snippet.channelId}`} onClick={(e) => e.stopPropagation()}>
                                        {/*
                                            stopPropagation will prevent the click event bubbling up to the outer link. otherwise it will jump to
                                            watch page instead of profile page
                                        */}
                                            <img src={item.channelThumbnail} style={{width:"40px", height:"40px", borderRadius:"50%"}} alt="error"></img>
                                        </Link>
                                        <Description>
                                            <div style={{fontSize:"18px"}}>{item.snippet.title}</div>
                                            <div style={{color:"#d0d0d0", fontSize:"16px"}}>{item.snippet.channelTitle}</div>
                                            <div style={{color:"#d0d0d0", fontSize:"16px"}}>
                                                <span>{`${convertCount(item.statistics.viewCount)} views`}</span>
                                                <LuDot></LuDot>
                                                <span>{convertTime(item.snippet.publishedAt)}</span>
                                            </div>
                                        </Description>
                                    </Details>
                                </Card>
                            </Link>
                        ))}
                    </GridContainer>
                </InfiniteScroll>
            }
        </>
    )
}

export default Home;
//it's completely normal that we can't scroll anymore after around 10 times of fetching data from the backend.
//in the response of the last fetching there is no nextPageToken so i guess youtube sets a limit to the number of videos that can be fetched
