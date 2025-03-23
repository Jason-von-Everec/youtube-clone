import Home from "./pages/Home";
import Watch from "./pages/Watch";
import Profile from "./pages/Profile";
import Search from "./pages/Search";
import { useState } from "react";
import Header from "./components/Header";
import SideBar from "./components/SideBar";
import { BrowserRouter, Routes, Route } from "react-router-dom";

function App() {
    const [isExpanded, setIsExpanded]=useState(false);
    const [categoryId, setCategoryId]=useState(null);
  return (
    <BrowserRouter>
      <Header isExpanded={isExpanded} setIsExpanded={setIsExpanded}></Header>
      <SideBar isExpanded={isExpanded} categoryId={categoryId} setCategoryId={setCategoryId}></SideBar>
      <Routes>
        <Route path="/" element={<Home isExpanded={isExpanded} categoryId={categoryId}/>}/>
        <Route path="/watch/:videoId" element={<Watch isExpanded={isExpanded}/>}/>
        {/*videoId will receive the value from to property of link tag from grid.jsx and then display it in url*/}
        <Route path="/profile/:channelId" element={<Profile isExpanded={isExpanded}/>}/>
        <Route path="/search" element={<Search isExpanded={isExpanded}/>}/>
      </Routes>
    </BrowserRouter>  
  )
}

export default App
