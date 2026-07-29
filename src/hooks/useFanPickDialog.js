import { useCallback, useMemo, useState } from "react";

const useFanPickDialog = ({ lockBodyScroll = false } = {}) => {
  const [dialog, setDialog] = useState(null);

  const showDialog = useCallback((nextDialog) => {
    setDialog({
      cancelText: "",
      confirmText: "확인",
      description: "",
      showAccentLine: true,
      showCloseButton: true,
      title: "",
      ...nextDialog,
    });
  }, []);

  const closeDialog = useCallback(() => {
    const onClose = dialog?.onClose;

    setDialog(null);
    onClose?.();
  }, [dialog]);

  const confirmDialog = useCallback(() => {
    const onConfirm = dialog?.onConfirm;

    setDialog(null);
    onConfirm?.();
  }, [dialog]);

  const dialogProps = useMemo(
    () => ({
      cancelText: dialog?.cancelText ?? "",
      confirmText: dialog?.confirmText ?? "확인",
      description: dialog?.description ?? "",
      isOpen: Boolean(dialog),
      lockBodyScroll,
      onClose: closeDialog,
      onConfirm: confirmDialog,
      showAccentLine: dialog?.showAccentLine ?? true,
      showCloseButton: dialog?.showCloseButton ?? true,
      title: dialog?.title ?? "",
    }),
    [closeDialog, confirmDialog, dialog, lockBodyScroll],
  );

  return {
    closeDialog,
    dialogProps,
    showDialog,
  };
};

export default useFanPickDialog;
