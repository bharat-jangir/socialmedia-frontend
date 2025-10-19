import { Avatar, Card, CardHeader } from "@mui/material";
import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { searchUsers } from "../state/Auth/authActions";
import { useSelector } from "react-redux";
import { createChat } from "../state/Message/message.action";
import { useDebounce } from "../hooks/useDebounce";

function SearchChat() {
  const dispatch = useDispatch();
  const [userName, setUserName] = useState("");
  
  const {message,auth} = useSelector((state) => ({
    message: state.message,
    auth: state.auth
  }));
  
  // Debounce search query with 500ms delay
  const debouncedUserName = useDebounce(userName, 500);
  
  function handleSearchUser(e) {
    setUserName(e.target.value);
    console.log("Search User input changed");
  }

  // Effect to handle debounced search
  useEffect(() => {
    if (debouncedUserName.trim().length > 0) {
      console.log("🔍 Debounced chat search triggered for:", debouncedUserName);
      dispatch(searchUsers(debouncedUserName));
    }
  }, [debouncedUserName, dispatch]);

  function handleClick(id){
    console.log("clicked",id);
    dispatch(createChat({userId: id}));
  }

  return (
    <div>
      <div className="py-5 relative">
        <input
          type="text"
          className="bg-transparent border border-[#3b4054] outline-none w-full px-5 py-3 rounded-full"
          placeholder="Search User..."
          onChange={handleSearchUser}
        />

        {userName &&
          auth.users?.map((item) => (
            <Card
              key={item.id}
              className="absolute w-full z-10 top-[4.5rem] cursor-pointer"
            >
              <CardHeader
                onClick={() => {
                  handleClick(item.id);
                  setUserName("");
                }}
                avatar={
                  <Avatar 
                    src={item.profileImage}
                  >
                    {item.fname?.charAt(0) || "U"}
                  </Avatar>
                }
                title={(item.fname || '') + " " + (item.lname || '')}
                subheader={
                  (item.fname?.toLowerCase() || '') + "_" + (item.lname?.toLowerCase() || '')
                }
              />
            </Card>
          ))}
      </div>
    </div>
  );
}

export default SearchChat;
