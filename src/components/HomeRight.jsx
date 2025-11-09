import SearchUser from "./SearchUser";
import PopularUserCard from "./PopularUserCard";
import { Card, Button, Menu, MenuItem, Chip, CircularProgress, Alert } from "@mui/material";
import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTheme } from "@mui/material/styles";
import { 
  getAllSuggestions, 
  getMutualSuggestions, 
  getGenderBasedSuggestions, 
  getAllTypesDetailed,
  setFilterType 
} from "../state/SuggestedFriends/suggestedFriends.action";
import { KeyboardArrowDown } from "@mui/icons-material";

function HomeRight() {
  const dispatch = useDispatch();
  const theme = useTheme();
  const { user } = useSelector((state) => state.auth);
  const { 
    suggestions, 
    mutualSuggestions, 
    genderBasedSuggestions, 
    detailedSuggestions,
    currentFilter,
    loading, 
    error 
  } = useSelector((state) => state.suggestedFriends);

  const [anchorEl, setAnchorEl] = useState(null);
  const [displayedSuggestions, setDisplayedSuggestions] = useState([]);

  // Filter options
  const filterOptions = [
    { value: 'all', label: 'All Suggestions', action: getAllSuggestions },
    { value: 'mutual', label: 'Mutual Friends', action: getMutualSuggestions },
    { value: 'gender', label: 'Similar Interests', action: getGenderBasedSuggestions },
    { value: 'detailed', label: 'Detailed Recommendations', action: getAllTypesDetailed }
  ];

  // Load suggestions based on current filter
  useEffect(() => {
    if (user?.id) {
      const currentFilterOption = filterOptions.find(option => option.value === currentFilter);
      if (currentFilterOption) {
        dispatch(currentFilterOption.action(user.id));
      }
    }
  }, [user?.id, currentFilter, dispatch]);

  // Update displayed suggestions based on current filter
  useEffect(() => {
    switch (currentFilter) {
      case 'mutual':
        setDisplayedSuggestions(Array.isArray(mutualSuggestions) ? mutualSuggestions : []);
        break;
      case 'gender':
        setDisplayedSuggestions(Array.isArray(genderBasedSuggestions) ? genderBasedSuggestions : []);
        break;
      case 'detailed':
        // Handle detailed suggestions - it might be an object with nested arrays or a flat array
        if (detailedSuggestions && typeof detailedSuggestions === 'object' && !Array.isArray(detailedSuggestions)) {
          // If it's an object, combine all nested arrays and deduplicate by user ID
          const allDetailed = [
            ...(detailedSuggestions.all_suggestions || []),
            ...(detailedSuggestions.mutual_friends || []),
            ...(detailedSuggestions.gender_based || [])
          ];
          // Remove duplicates based on user ID using a Set for better performance
          const seenIds = new Set();
          const uniqueDetailed = allDetailed.filter((user) => {
            const userId = user.id?.toString() || user.userId?.toString();
            if (!userId || seenIds.has(userId)) {
              return false;
            }
            seenIds.add(userId);
            return true;
          });
          setDisplayedSuggestions(uniqueDetailed);
        } else {
          setDisplayedSuggestions(Array.isArray(detailedSuggestions) ? detailedSuggestions : []);
        }
        break;
      default:
        setDisplayedSuggestions(Array.isArray(suggestions) ? suggestions : []);
    }
  }, [currentFilter, suggestions, mutualSuggestions, genderBasedSuggestions, detailedSuggestions]);

  const handleFilterChange = (filterValue) => {
    dispatch(setFilterType(filterValue));
    setAnchorEl(null);
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const getFilterLabel = () => {
    const option = filterOptions.find(opt => opt.value === currentFilter);
    return option ? option.label : 'All Suggestions';
  };

  return (
    <div className="pr-2 sm:pr-5">
      <SearchUser />

      <Card className="p-3 sm:p-5">
        <div className="flex justify-between py-3 sm:py-5 items-center mt-2 sm:mt-4">
          <p className="font-semibold opacity-70 ml-2 sm:ml-5 text-sm sm:text-base">Suggestions For You</p>
          <div className="flex items-center gap-2">
            <Button
              size="small"
              variant="outlined"
              onClick={handleMenuOpen}
              endIcon={<KeyboardArrowDown />}
              sx={{ 
                textTransform: 'none',
                fontSize: '0.75rem',
                minWidth: 'auto',
                px: 1
              }}
            >
              {getFilterLabel()}
            </Button>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
            >
              {filterOptions.map((option) => (
                <MenuItem 
                  key={option.value} 
                  onClick={() => handleFilterChange(option.value)}
                  selected={currentFilter === option.value}
                >
                  {option.label}
                </MenuItem>
              ))}
            </Menu>
            <p 
              className="text-xs font-semibold mr-2 sm:mr-5"
              style={{ color: theme.palette.text.primary, opacity: 0.95 }}
            >
              View All
            </p>
          </div>
        </div>

        {error && (
          <Alert severity="error" sx={{ mb: 2, mx: 2 }}>
            {typeof error === 'string' ? error : error.message || 'An error occurred'}
          </Alert>
        )}

        <div>
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <CircularProgress size={24} />
              <span 
                className="ml-2 text-sm"
                style={{ color: theme.palette.text.secondary, opacity: 0.7 }}
              >
                Loading suggestions...
              </span>
            </div>
          ) : displayedSuggestions.length > 0 ? (
            displayedSuggestions.slice(0, 5).map((suggestion) => (
              <PopularUserCard 
                key={suggestion.id} 
                user={suggestion} 
                suggestionType={currentFilter}
              />
            ))
          ) : (
            <div className="text-center py-8">
              <p 
                className="text-sm"
                style={{ color: theme.palette.text.secondary, opacity: 0.7 }}
              >
                No suggestions available
              </p>
              <p 
                className="text-xs mt-1"
                style={{ color: theme.palette.text.disabled, opacity: 0.5 }}
              >
                Try changing the filter or check back later
              </p>
            </div>
          )}
        </div>

        {displayedSuggestions.length > 5 && (
          <div className="text-center mt-3">
            <Chip 
              label={`+${displayedSuggestions.length - 5} more suggestions`}
              size="small"
              variant="outlined"
              sx={{ fontSize: '0.75rem' }}
            />
          </div>
        )}
      </Card>
    </div>
  );
}

export default HomeRight;
