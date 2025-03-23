import axios from 'axios';
const API_Key=import.meta.env.VITE_YOUTUBE_API_KEY;

function getVideoList(categoryId, videoId, nextPageToken, setNextPageToken, videos, setVideos){
    const params = {
        key: API_Key,
        part: 'snippet,statistics,contentDetails',
        maxResults: 20,
        pageToken: nextPageToken || ''// Pass empty string if no token
    };

    // Add categoryId conditionally
    if (categoryId !== null) {
        params.videoCategoryId = categoryId;
    }
    if (videoId !== null) {
        params.id = videoId;
    }else{
        params.chart = "mostPopular";
    }
    axios.get('https://www.googleapis.com/youtube/v3/videos', { params })
    .then((response) => {
        const data = response.data;
        const newVideos = data.items;
        if (setNextPageToken!==null){
            setNextPageToken(data.nextPageToken || null);//if there are no more page, nextPageToken field will not appear in the response
        }
        //getChannelList(newVideos);
        //make sure the thumbnails for channels are updated first
        getChannelList(newVideos).then((updatedVideos) => {
            setVideos((prevVideos) => [...(prevVideos||[]), ...updatedVideos]);
            /*
            if (prevVideos){
                setVideos([...prevVideos.current, ...updatedVideos]);
            }else{
                setVideos([...updatedVideos]);
            }   
            */ 
        });
    })
    .catch((error) => console.error(error));
}

function getChannelList(newVideos){
    //const channelIdArray=videos.map((video)=>video.snippet.channelId);
    const channelIdArray=newVideos.map((video)=>video.snippet.channelId);
    //updating videos is asynchronous so if you use videos to get channel IDs you will find that when the page is first mounted there are no channel thumbnails
    const channelIdString=channelIdArray.join(",");//this comma-separated format is required by youtube api
    const channelData={};
    /*
    notice that sometimes the length of the response from getChannelList is different from the length of the response from getVideoList
    for example there was one time that newVideos has 20 items but getChannelList only returns 19 items and this mismatch cause undefined error
    when it tries to read properties from the 20th item because of out of index. then i realized videos displayed in the home page could be from 
    the same channel. the above problem happens because there are two videos from the same channel so there are duplicate strings in channelIdString
    and the youtube backend will ignore duplicate string and only return 1 item. the solution is to create a map using channelId as its key(
    previous method uses index to retrieve object from channelData which is an array while now i use key to retrieve object from channelData
    which is a map/dictionary/nested object)
    */
    return axios.get(`https://www.googleapis.com/youtube/v3/channels?key=${API_Key}&part=snippet,statistics&id=${channelIdString}`)
    .then((response) => {
        //console.log(response);
        //"||"ensures when the thumbnails of certain channels are missing, an empty string will be added to the array for padding/alignment purposes
        //although axios doesn't require us to manually parse response to json we still need to get the parsed result from response.data 
        response.data.items.map((item) => (channelData[item.id]={
            thumbnail: item.snippet.thumbnails.default.url || "", // Default to an empty string if missing
            subscriberCount: item.statistics.subscriberCount || "0", // Default to "0" if missing
        }));

        // Map the new video list to include channel thumbnails and subscriber counts
        return newVideos.map((video) => ({
            ...video, // Preserve existing video properties
            channelThumbnail: channelData[video.snippet.channelId].thumbnail || "", // Add thumbnail
            subscriberCount: channelData[video.snippet.channelId].subscriberCount || "0", // Add subscriber count
        }));
    })
    .catch((error) => console.error(error));
}

function convertDuration(duration){
    if (duration=="P0D"){//this is a special duration indicating that the video might be an ongoing live stream or private or deleted
        return "00:00";
    }
    const matches = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    /*
    match is a method of string, it's often used with regular expression. "/ /" signifies the start and end of the expression while "\d"
    matches digit and "+" means there are 1 or more digits. more importantly, "?" is indispensable because it means there will be 0 or 1 match.
    without "?", when a duration string doesn't have an hour part, it will cause the whole string to fail to match with the regular expression.
    take PT32S for example, matches will look like this: ["PT32S", undefined, undefined, "32S"]. the first element in the match result will 
    always be the full string, if the match succeeds. if any sub-expressions in those "()" fails, the match method will return null
    */
    const hours = matches[1] ? parseInt(matches[1]) : 0;
    const minutes = matches[2] ? parseInt(matches[2]) : 0;
    const seconds = matches[3] ? parseInt(matches[3]) : 0;
    //parseInt is a built-in javascript function used to extract the number part of a string but it's weird why it's not a method of string
    let hh="";
    let mm="";
    let ss="";
    hours.toString().length==1? hh=`0${hours}`:hh=hours.toString();
    minutes.toString().length==1? mm=`0${minutes}`:mm=minutes.toString();
    seconds.toString().length==1? ss=`0${seconds}`:ss=seconds.toString();
    let f_Duration="";
    if (hours!==0){
        f_Duration=`${hh}:${mm}:${ss}`;
    }else{
        f_Duration=`${mm}:${ss}`;
    }
    return f_Duration;
}

function convertTime(timestamp){
    const now=new Date().toISOString();//this will convert date object which is in milliseconds to the timestamp format
    const matches1=timestamp.match(/^(\d+)-(\d+)-(\d+)T(\d+):(\d+):(\d+)Z$/);
    const matches2=now.match(/^(\d+)-(\d+)-(\d+)T(\d+):(\d+):(\d+)(\.\d+)?Z$/);
    //"." in regex means any character so you have to escape it with "\" to represent "." literally
    //the second regex is a little different because real timestamp(compared with timestamp provided by youtube api)
    //normally has millisecond part after decimal point but we don't need that part
    //console.log("matches1 are:", matches1);
    //console.log("matches2 are:", matches2);
    const diff_year=parseInt(matches2[1])-parseInt(matches1[1]);
    const diff_month=parseInt(matches2[2])-parseInt(matches1[2]);
    const diff_day=parseInt(matches2[3])-parseInt(matches1[3]);
    const diff_hour=parseInt(matches2[4])-parseInt(matches1[4]);
    const diff_minute=parseInt(matches2[5])-parseInt(matches1[5]);
    if (diff_year>=1){
        return(diff_year==1? `1 year ago`:`${diff_year} years ago`);
    }else if (diff_month>=1){
        return(diff_month==1? `1 month ago`:`${diff_month} months ago`);
    }else if (diff_day>=1){
        return(diff_day==1? `1 day ago`:`${diff_day} days ago`);
    }else if (diff_hour>=1){
        return(diff_hour==1? `1 hour ago`:`${diff_hour} hours ago`);
    }else if (diff_minute>=1){
        return(diff_minute==1? `1 minute ago`:`${diff_minute} minutes ago`);
    }else{
        return("just now");
    }
}
//when it comes to division between two integers, we always presume that the result should be an integer too.
//however, in javascript the result of such division is a float so we have to use floor method to round down the result.
function convertCount(viewcount){
    const n=parseInt(viewcount);
    if (Math.floor(n/1000000)>=1){
        return(`${Math.floor(n/1000000)}.${Math.floor((n%1000000)/100000)}M`);
    }else if (Math.floor(n/1000)>=1){
        return(`${Math.floor(n/1000)}.${Math.floor((n%1000)/100)}K`);
    }else{
        return(`${n}`);
    }
}

function getPlaylistitems(playlist, nextPageToken, setNextPageToken, videos, setVideos){
    const params={
        key: API_Key,
        part: "snippet,contentDetails",
        playlistId: playlist,
        maxResults: 12,
        pageToken: nextPageToken || ''
    }
    axios.get("https://www.googleapis.com/youtube/v3/playlistItems", {params})
    .then((response) => {
        console.log("videos in this playlist are:", response);
        const videoIdArray=response.data.items.map((item,index)=>(item.contentDetails.videoId));
        const videoIdString=videoIdArray.join(',');
        if (setNextPageToken!==null){
            setNextPageToken(response.data.nextPageToken || null);
        }
        getVideoList(null, videoIdString, null, null, videos, setVideos);
    })
    .catch((error) => console.error(error));
}

export { getVideoList, getChannelList, convertDuration, convertTime, convertCount, getPlaylistitems };