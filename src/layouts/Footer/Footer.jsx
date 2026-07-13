import {
  FaFacebookF,
  FaBloggerB,
  FaInstagram,
  FaYoutube,
} from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";

import styles from "./Footer.module.css";

const policyLinks = [
  { label: "이용약관", href: "#" },
  { label: "개인정보 처리방침", href: "#" },
  { label: "이메일주소 무단 수집거부", href: "#" },
];

const socialLinks = [
  {
    label: "페이스북",
    href: "#",
    icon: FaFacebookF,
  },
  {
    label: "블로그",
    href: "#",
    icon: FaBloggerB,
  },
  {
    label: "엑스",
    href: "#",
    icon: FaXTwitter,
  },
  {
    label: "인스타그램",
    href: "#",
    icon: FaInstagram,
  },
  {
    label: "유튜브",
    href: "#",
    icon: FaYoutube,
  },
];

function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.inner}`}>
        <div className={styles.topArea}>
          <nav aria-label="푸터 정책 메뉴">
            <ul className={styles.policyList}>
              {policyLinks.map((link) => (
                <li key={link.label} className={styles.policyItem}>
                  <a href={link.href} className={styles.policyLink}>
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <ul className={styles.socialList}>
            {socialLinks.map(({ label, href, icon: Icon }) => (
              <li key={label}>
                <a
                  href={href}
                  className={styles.socialLink}
                  aria-label={label}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Icon aria-hidden="true" />
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className={styles.bottomArea}>
          <div className={styles.companyInfo}>
            <div className={styles.infoRow}>
              <p>대표이사: 유레카 스페이스</p>

              <p>
                주소 : 서울특별시 강남구 선릉로 428 (지번: 대치동 889-41)
                멀티캠퍼스 선릉
              </p>
            </div>

            <div className={styles.infoRow}>
              <p>고객센터 : 02-123-4567</p>
              <p>사업자등록번호 : 012-34-56789</p>
            </div>

            <p className={styles.copyright}>
              COPYRIGHT© 2026 FanPick. ALL RIGHTS RESERVED
            </p>
          </div>

          <span className={styles.wordmark}>FanPick</span>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
