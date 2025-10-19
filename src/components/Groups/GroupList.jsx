import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  CircularProgress,
} from "@mui/material";
import { getUserGroups, searchGroups } from "../../state/Groups/groupActions";
import GroupCard from "./GroupCard";
import GroupDetailsModal from "./GroupDetailsModal";

const GroupList = ({ onGroupSelect }) => {
  const dispatch = useDispatch();
  const { groups, publicGroups, searchResults, loading, error } = useSelector((state) => state.groups);
  const currentUser = useSelector((state) => state.auth.user);

  // Local state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  // Load user groups on component mount
  useEffect(() => {
    if (currentUser?.id) {
      dispatch(getUserGroups());
    }
  }, [dispatch, currentUser?.id]);


  // Handle search
  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (query.trim()) {
      setSearchLoading(true);
      try {
        await dispatch(searchGroups(query));
      } finally {
        setSearchLoading(false);
      }
    }
  };

  // Handle group click
  const handleGroupClick = (group) => {
    if (onGroupSelect) {
      // If onGroupSelect is provided, use it for direct group selection (for messaging)
      onGroupSelect(group);
    } else {
      // Otherwise, open the details modal
      setSelectedGroup(group);
      setIsDetailsModalOpen(true);
    }
  };


  return (
    <div className="h-full">
      {/* Search Bar */}
      <div className="py-5 relative">
        <input
          type="text"
          className="bg-transparent border border-[#3b4054] outline-none w-full px-5 py-3 rounded-full"
          placeholder="Search groups..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
        />
        {searchLoading && (
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
            <CircularProgress size={20} className="text-blue-500" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="h-full space-y-4 overflow-y-scroll hideScrollbar">
        {error && (
          <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-lg text-red-300 text-sm">
            {(() => {
              const errorMessage = typeof error === 'string' ? error : error.message || 'An error occurred';
              if (errorMessage.includes('SQL') || errorMessage.includes('JDBC') || errorMessage.includes('syntax')) {
                return 'Unable to load groups. Please try again later.';
              }
              if (errorMessage.includes('Failed to get user groups')) {
                return 'Unable to load your groups. Please refresh the page.';
              }
              if (errorMessage.includes('already reacted with this emoji')) {
                return 'Reaction already added. Click the emoji again to remove it.';
              }
              if (errorMessage.includes('Failed to add reaction')) {
                return 'Unable to add reaction. Please try again.';
              }
              return errorMessage;
            })()}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center h-32">
            <CircularProgress size={40} className="text-blue-500" />
          </div>
        ) : (
          <>
            {groups.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center px-8">
                <div className="text-6xl text-gray-500 mb-4">👥</div>
                <h3 className="text-lg font-semibold text-gray-300 mb-2">
                  {searchQuery.trim() ? "No groups found" : "No groups yet"}
                </h3>
                <p className="text-gray-500 text-sm">
                  {searchQuery.trim()
                    ? "Try searching with different keywords"
                    : "Create your first group to start collaborating"}
                </p>
                {searchQuery.trim() && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="mt-4 px-4 py-2 text-sm text-gray-400 hover:text-gray-300 border border-gray-600 rounded-lg hover:border-gray-500"
                  >
                    Clear Search
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {groups.map((group) => (
                  <GroupCard
                    key={group.id}
                    group={group}
                    onClick={() => handleGroupClick(group)}
                    currentUser={currentUser}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Group Details Modal */}
      <GroupDetailsModal
        open={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        group={selectedGroup}
      />
    </div>
  );
};

export default GroupList;
