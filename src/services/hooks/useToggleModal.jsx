import { useState } from "react";

const useToggleModal = () => {
  const [open, setOpen] = useState(false);

  const onOpen = () => {
    setOpen(true);
  };

    const onClose = () => {
     setOpen(false);
    }

  return { open, onOpen, onClose };
};

export default useToggleModal;
