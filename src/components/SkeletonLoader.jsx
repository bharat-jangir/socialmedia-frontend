import React from 'react';
import { Skeleton, Card, Box } from '@mui/material';

// Skeleton for Story Circle
export const StorySkeleton = () => (
  <div className="flex-shrink-0">
    <div className="flex flex-col items-center mr-3 sm:mr-4">
      <Skeleton 
        variant="circular" 
        sx={{ 
          width: { xs: 56, sm: 64, md: 80 }, 
          height: { xs: 56, sm: 64, md: 80 },
          bgcolor: 'rgba(255, 255, 255, 0.1)' 
        }}
      />
      <Skeleton 
        variant="text" 
        width={60} 
        height={16} 
        sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)', mt: 1 }}
      />
    </div>
  </div>
);

// Skeleton for Post Card
export const PostSkeleton = () => (
  <Card className="p-3 sm:p-5 bg-[#212534] border border-gray-700">
    {/* Header */}
    <div className="flex items-center space-x-3 mb-3">
      <Skeleton 
        variant="circular" 
        width={40} 
        height={40} 
        sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)' }}
      />
      <div className="flex-1">
        <Skeleton 
          variant="text" 
          width="60%" 
          height={20} 
          sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)' }}
        />
        <Skeleton 
          variant="text" 
          width="40%" 
          height={16} 
          sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)' }}
        />
      </div>
    </div>
    
    {/* Content */}
    <div className="mb-3">
      <Skeleton 
        variant="text" 
        width="100%" 
        height={16} 
        sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)', mb: 1 }}
      />
      <Skeleton 
        variant="text" 
        width="80%" 
        height={16} 
        sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)' }}
      />
    </div>
    
    {/* Image/Video */}
    <Skeleton 
      variant="rectangular" 
      width="100%" 
      height={300} 
      sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)', borderRadius: 2, mb: 3 }}
    />
    
    {/* Actions */}
    <div className="flex items-center space-x-4">
      <Skeleton 
        variant="circular" 
        width={24} 
        height={24} 
        sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)' }}
      />
      <Skeleton 
        variant="circular" 
        width={24} 
        height={24} 
        sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)' }}
      />
      <Skeleton 
        variant="circular" 
        width={24} 
        height={24} 
        sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)' }}
      />
      <div className="flex-1" />
      <Skeleton 
        variant="circular" 
        width={24} 
        height={24} 
        sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)' }}
      />
    </div>
  </Card>
);

// Skeleton for Upload Section
export const UploadSkeleton = () => (
  <Card className="p-3 sm:p-5 mt-3 sm:mt-5 bg-[#212534] border border-gray-700">
    <div className="flex justify-between items-center">
      <Skeleton 
        variant="circular" 
        width={40} 
        height={40} 
        sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)' }}
      />
      <Skeleton 
        variant="rectangular" 
        width="80%" 
        height={40} 
        sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)', borderRadius: 20, ml: 2 }}
      />
    </div>
    <div className="flex justify-center space-x-6 sm:space-x-9 mt-3 sm:mt-5">
      <div className="flex items-center">
        <Skeleton 
          variant="circular" 
          width={24} 
          height={24} 
          sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)' }}
        />
        <Skeleton 
          variant="text" 
          width={40} 
          height={16} 
          sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)', ml: 1 }}
        />
      </div>
      <div className="flex items-center">
        <Skeleton 
          variant="circular" 
          width={24} 
          height={24} 
          sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)' }}
        />
        <Skeleton 
          variant="text" 
          width={40} 
          height={16} 
          sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)', ml: 1 }}
        />
      </div>
      <div className="flex items-center">
        <Skeleton 
          variant="circular" 
          width={24} 
          height={24} 
          sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)' }}
        />
        <Skeleton 
          variant="text" 
          width={50} 
          height={16} 
          sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)', ml: 1 }}
        />
      </div>
    </div>
  </Card>
);

// Skeleton for App Loading
export const AppLoadingSkeleton = () => (
  <div className="flex items-center justify-center h-screen bg-[#212534]">
    <div className="text-center">
      <Skeleton 
        variant="circular" 
        width={80} 
        height={80} 
        sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)', mb: 3 }}
      />
      <Skeleton 
        variant="text" 
        width={100} 
        height={24} 
        sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)' }}
      />
    </div>
  </div>
);

// Skeleton for Sidebar
export const SidebarSkeleton = () => (
  <Card className="card h-screen flex flex-col justify-between py-3 sm:py-5">
    <div className="space-y-6 sm:space-y-8 pl-3 sm:pl-5">
      <div>
        <Skeleton 
          variant="text" 
          width={120} 
          height={32} 
          sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)' }}
        />
      </div>
      
      <div className="space-y-4 sm:space-y-6 lg:space-y-8">
        {[1, 2, 3, 4, 5].map((item) => (
          <div key={item} className="flex space-x-2 sm:space-x-3 items-center p-2 rounded-lg">
            <Skeleton 
              variant="circular" 
              width={24} 
              height={24} 
              sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)' }}
            />
            <Skeleton 
              variant="text" 
              width={80} 
              height={20} 
              sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)' }}
            />
          </div>
        ))}
      </div>
    </div>
    
    <div>
      <Skeleton 
        variant="rectangular" 
        width="100%" 
        height={1} 
        sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)' }}
      />
      <div className="pl-3 sm:pl-5 flex items-center justify-between pt-3 sm:pt-5">
        <div className="flex items-center space-x-2 sm:space-x-3">
          <Skeleton 
            variant="circular" 
            width={40} 
            height={40} 
            sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)' }}
          />
          <div className="hidden sm:block">
            <Skeleton 
              variant="text" 
              width={80} 
              height={20} 
              sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)' }}
            />
            <Skeleton 
              variant="text" 
              width={60} 
              height={16} 
              sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)' }}
            />
          </div>
        </div>
        <Skeleton 
          variant="circular" 
          width={24} 
          height={24} 
          sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)' }}
        />
      </div>
    </div>
  </Card>
);

// Skeleton for HomeRight
export const HomeRightSkeleton = () => (
  <div className="pr-2 sm:pr-5">
    {/* Search Skeleton */}
    <Card className="p-3 sm:p-5 mb-4">
      <Skeleton 
        variant="rectangular" 
        width="100%" 
        height={40} 
        sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)', borderRadius: 2 }}
      />
    </Card>
    
    {/* Suggestions Skeleton */}
    <Card className="p-3 sm:p-5">
      <div className="flex justify-between py-3 sm:py-5 items-center mt-2 sm:mt-4">
        <Skeleton 
          variant="text" 
          width={120} 
          height={20} 
          sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)' }}
        />
        <Skeleton 
          variant="text" 
          width={60} 
          height={16} 
          sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)' }}
        />
      </div>
      <div>
        {[1, 2, 3, 4, 5].map((suggestion) => (
          <div key={suggestion} className="flex items-center space-x-3 mb-3">
            <Skeleton 
              variant="circular" 
              width={40} 
              height={40} 
              sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)' }}
            />
            <div className="flex-1">
              <Skeleton 
                variant="text" 
                width="70%" 
                height={18} 
                sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)' }}
              />
              <Skeleton 
                variant="text" 
                width="50%" 
                height={14} 
                sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)' }}
              />
            </div>
            <Skeleton 
              variant="rectangular" 
              width={60} 
              height={24} 
              sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)', borderRadius: 2 }}
            />
          </div>
        ))}
      </div>
    </Card>
  </div>
);
