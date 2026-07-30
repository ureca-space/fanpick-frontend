import { useState } from "react";
import styles from "../TeamDetailPage.module.css";

const MemberPhoto = ({ member }) => {
  const [activePhoto, setActivePhoto] = useState(member.photo);

  const handlePhotoError = () => {
    if (activePhoto !== member.fallbackPhoto) {
      setActivePhoto(member.fallbackPhoto);
    }
  };

  return (
    <img
      className={styles.memberPhoto}
      src={activePhoto}
      alt={`${member.name} 프로필 이미지`}
      loading="lazy"
      onError={handlePhotoError}
    />
  );
};

export default MemberPhoto;
