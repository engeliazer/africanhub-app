import { AppLinks } from "../constants/navigation";

const useFilterMenu = (menu) => {
  if (!menu) return [];
  
  return AppLinks.filter(link => 
    menu.some(menuItem => menuItem.name.toLowerCase() === link.name.toLowerCase())
  );
};

export default useFilterMenu;
