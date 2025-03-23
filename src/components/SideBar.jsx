import React, {useState} from 'react';
import styled from "styled-components";
import { useNavigate } from 'react-router-dom';
import { MdHomeFilled } from "react-icons/md";
import { LuMusic4 } from "react-icons/lu";
import { SiYoutubegaming } from "react-icons/si";
import { RiMovie2Fill } from "react-icons/ri";
import { GoTrophy } from "react-icons/go";
import { ImNewspaper } from "react-icons/im";

const Menu=styled.div`
    position: fixed;
    top: 85px;
    left: 5px;
    width: ${(props) => (props.isExpanded ? "250px" : "80px")};
    transition: width 0.3s ease;
    display: flex;
    flex-direction: column;
    width: 80px;
`

const Option=styled.div`
    width: ${(props) => (props.isExpanded ? "200px" : "80px")};
    height: 80px;
    display: flex;
    flex-direction: ${(props)=>(props.isExpanded? "row": "column")};
    align-items: center;
    justify-content: ${(props)=>(props.isExpanded? "flex-start": "center")};
    padding-left: ${(props)=>(props.isExpanded? "25px": "0px")};
    border-radius: 10px;
    &:hover {
        background-color: #272727;
        cursor: pointer;
    }
`

const Text=styled.div`
    font-size: 14px;
    margin-top: 5px;
    margin-left: ${(props)=>(props.isExpanded? "15px": "0px")};
`
function SideBar({isExpanded, categoryId, setCategoryId}){
    const categoryIds={
        "Music":"10",
        "Sports":"17",
        "Gaming":"20",
        "News":"25",
        "Movies":"1"
    }
    const navigate=useNavigate();
    return(
        <Menu isExpanded={isExpanded}>
            <Option isExpanded={isExpanded} onClick={()=>{
                setCategoryId(null);
                navigate("/");
            }}>
                <MdHomeFilled size="30px"></MdHomeFilled>
                <Text isExpanded={isExpanded}>Home</Text>
            </Option>
            <Option isExpanded={isExpanded} onClick={()=>{
                setCategoryId(categoryIds["Music"]);
                navigate("/");
            }}>
                <LuMusic4 size="30px"></LuMusic4>
                <Text isExpanded={isExpanded}>Music</Text>
            </Option>
            <Option isExpanded={isExpanded} onClick={()=>{
                setCategoryId(categoryIds["Gaming"]);
                navigate("/");
            }}>
                <SiYoutubegaming size="30px"></SiYoutubegaming>
                <Text isExpanded={isExpanded}>Gaming</Text>
            </Option>
            <Option isExpanded={isExpanded} onClick={()=>{
                setCategoryId(categoryIds["Movies"]);
                navigate("/");
            }}>
                <RiMovie2Fill size="30px"></RiMovie2Fill>
                <Text isExpanded={isExpanded}>Movies</Text>
            </Option>
            <Option isExpanded={isExpanded} onClick={()=>{
                setCategoryId(categoryIds["Sports"]);
                navigate("/");
            }}>
                <GoTrophy size="30px"></GoTrophy>
                <Text isExpanded={isExpanded}>Sports</Text>
            </Option>
            <Option isExpanded={isExpanded} onClick={()=>{
                setCategoryId(categoryIds["News"]);
                navigate("/");
            }}>
                <ImNewspaper size="30px"></ImNewspaper>
                <Text isExpanded={isExpanded}>News</Text>
            </Option>
        </Menu>
    )
}

export default SideBar;