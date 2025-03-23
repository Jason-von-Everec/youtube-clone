import React, {useState} from 'react';
import styled from "styled-components";
import { RxHamburgerMenu } from "react-icons/rx";
import { FaYoutube } from "react-icons/fa";
import { IoSearchOutline } from "react-icons/io5";
import { IoClose } from "react-icons/io5";
import { useNavigate } from 'react-router-dom';

const HeaderContainer=styled.div`
    position: fixed;
    top: 0px;
    display: flex;
    height: 80px;
    align-items: center;
    justify-content: flex-start;
    width: 100%;
    z-index:100;
    background-color: #0c0c0c;
`
const TradeMark=styled.div`
    display: flex;
    align-items: center;
    height: 40px;
    &: hover{
        cursor: pointer;
    }
`

const SearchBar=styled.div`
    display: flex;
    border: 1px;
    border-style: solid;
    border-radius: 20px;
    overflow: hidden;
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    width: 30%;
`

const SearchInput=styled.input`
    border: none;
    padding: 10px;
    font-size: 16px;
    width: calc(100% - 60px);
    color: black;
`
const SearchButton = styled.button`
    border: none;
    width: 60px;
    cursor: pointer;
    padding: 5px 15px 5px 15px;
    border-left: 1px solid #ccc; /* Divider between input and button */
    background-color: #F7F7F8;
    &:hover {
        background-color: #e0e0e0;
    }
`

const CloseIcon=styled(IoClose)`
    position: absolute;
    top: 50%;
    right: 70px;
    transform: translateY(-50%);
    cursor: pointer;
    color: black;
`

const MenuIcon=styled.div`
    margin-left: 5px;
    margin-right: 30px;
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 50%;
    width: 80px;
    height: 80px;
    &:hover {
        cursor: pointer;
        background-color: #272727;
    }
`
function Header({isExpanded, setIsExpanded}){
    const [searchContent, setSearchContent]=useState("");
    const navigate=useNavigate();

    function handleKeyDown(event){
        if (event.key=="Enter"){
            event.preventDefault();//without this line pressing enter will cause submission of a form or addition of a new line
            if (searchContent.trim()){
                navigate(`/search?query=${searchContent}`);//not big difference from URL params but this is standard convention for search engines
            }else{
                navigate("/");
            }
        }
    }

    function handleBtn(){
        if (searchContent.trim()){
            navigate(`/search?query=${searchContent}`);//not big difference from URL params but this is standard convention for search engines
        }else{
            navigate("/");
        } 
    }
    return(
        <HeaderContainer>
            <MenuIcon onClick={()=>(isExpanded? setIsExpanded(false):setIsExpanded(true))}>
                <RxHamburgerMenu size="30px"></RxHamburgerMenu>
            </MenuIcon>
            <TradeMark onClick={()=>navigate('/')}>
                <FaYoutube color='red' size="40px"></FaYoutube>
                <span style={{fontSize:"24px", marginLeft:"5px"}}>YouTube</span>
            </TradeMark>
            <SearchBar>
                <SearchInput type='text' placeholder='Search' value={searchContent} onChange={(e)=>{setSearchContent(e.target.value)}} onKeyDown={(e)=>handleKeyDown(e)}></SearchInput>
                {searchContent && <CloseIcon onClick={()=>{setSearchContent("");}}/>}
                <SearchButton onClick={()=>handleBtn()}>
                    <IoSearchOutline color='black' size="26px"></IoSearchOutline>
                </SearchButton>
            </SearchBar>
        </HeaderContainer>
    )
}

export default Header;