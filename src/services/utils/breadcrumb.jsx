// Helper function to check if a string looks like a UUID/video ID
function isUUIDLike(str) {
  if (!str) return false;
  // Check if it's a long alphanumeric string (32+ characters, typical for UUIDs/video IDs)
  return /^[a-f0-9]{32,}$/i.test(str) || str.length > 30;
}

export function getPagesList(location)
{
  let pagesList = [];

  const pathname = location?.pathname?.replace("/", "");

if (pathname?.includes("/")) {
  pagesList = pathname?.split("/");
    
    // Filter out UUID-like segments for review-class route
    // If we're on review-class and the last segment is a UUID, remove it or replace with "Video"
    if (pagesList[0] === "review-class" && pagesList.length > 1) {
      const lastSegment = pagesList[pagesList.length - 1];
      if (isUUIDLike(lastSegment)) {
        // Just remove the UUID segment - breadcrumb will only show "Review Class"
        pagesList = pagesList.slice(0, -1);
      }
    }
  }

  return pagesList;
}

export function getPage(location)
{
  const pathname = location?.pathname?.replace("/", "");

  let page = "";

  if(!pathname?.includes("/")) {
    page = pathname;
  } else {
    // If pathname has segments, get the last one
    const segments = pathname.split("/");
    const lastSegment = segments[segments.length - 1];
    
    // Don't show UUID-like segments as the page name
    if (isUUIDLike(lastSegment)) {
      // For review-class route, return empty so it doesn't show
      if (segments[0] === "review-class") {
        page = "";
      } else {
        page = lastSegment;
      }
    } else {
      page = lastSegment;
    }
  }

  return page;
}