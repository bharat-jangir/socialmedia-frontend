import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { searchUsers } from "../state/Auth/authActions";
import { Avatar, Button, Card, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useDebounce } from "../hooks/useDebounce";

function SearchUser() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [showResults, setShowResults] = useState(false);

  const { users, loading } = useSelector((state) => state.auth);
  const currentUser = useSelector((state) => state.auth.user);

  // Debounce search query with 500ms delay
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  const handleSearch = (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.trim().length > 0) {
      setShowResults(true);
    } else {
      setShowResults(false);
    }
  };

  // Effect to handle debounced search
  useEffect(() => {
    if (debouncedSearchQuery.trim().length > 0) {
      console.log("🔍 Debounced search triggered for:", debouncedSearchQuery);
      dispatch(searchUsers(debouncedSearchQuery));
    }
  }, [debouncedSearchQuery, dispatch]);

  const handleUserClick = (userId) => {
    navigate(`/profile/${userId}`);
    setShowResults(false);
    setSearchQuery("");
  };

  return (
    <div className="mb-5 w-[95%] relative" style={{ marginTop: "4rem" }}>
      <input
        className="ml-5 h-14 outline-none w-full bg-slate-300 rounded-full px-5 bg-transparent border border-[#3b4054]"
        type="text"
        placeholder="Search User"
        value={searchQuery}
        onChange={handleSearch}
      />

      {/* Search Results */}
      {showResults && (
        <Card className="absolute top-full left-5 right-0 mt-2 z-50 max-h-96 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-500">Searching...</p>
            </div>
          ) : users && users.length > 0 ? (
            <div className="p-2">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center p-3 hover:bg-gray-50 cursor-pointer rounded-md"
                  onClick={() => handleUserClick(user.id)}
                >
                  <Avatar
                    src={user.profilePicture || user.image}
                    sx={{ width: 40, height: 40, mr: 2 }}
                  >
                    {user.fname?.charAt(0) || "U"}
                  </Avatar>
                  <div className="flex-1">
                    <Typography variant="subtitle2" className="font-semibold">
                      {user.fname} {user.lname}
                    </Typography>
                    <Typography variant="body2" className="text-gray-500">
                      @{user.fname?.toLowerCase()}_{user.lname?.toLowerCase()}
                    </Typography>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-gray-500">
              <p>No users found</p>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

export default SearchUser;
