import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase.js";

const MyPage = () => {
  const [userInfo, setUserInfo] = useState({
    nickname: "",
    email: "",
  });

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const getUserInfo = async () => {
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();

        if (error) {
          throw error;
        }

        setUserInfo({
          nickname: user?.user_metadata?.nickname || "닉네임 없음",
          email: user?.email || "",
        });
      } catch (error) {
        console.error("회원 정보 조회 오류:", error);
      } finally {
        setIsLoading(false);
      }
    };

    getUserInfo();
  }, []);

  if (isLoading) {
    return <main>회원 정보를 불러오는 중...</main>;
  }

  return (
    <main>
      <h1>마이페이지</h1>

      <p>
        닉네임: <strong>{userInfo.nickname}</strong>
      </p>

      <p>
        이메일: <strong>{userInfo.email}</strong>
      </p>
    </main>
  );
};

export default MyPage;
