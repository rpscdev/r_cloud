import { MdEmail, MdPhone } from "react-icons/md";
import { IoLogoWhatsapp } from "react-icons/io";
import './Footer.css';

const Footer = () => {
    const currentYear = new Date().getFullYear();

    
    const email = "rpscdev@gmail.com";
    const phoneNo = "+49 15783749528"; 
    const whatsappNo = "4915783749528"; 
  return (
    
    <footer id="contact-footer" className="footer-section">
      <div className="footer-container container">
        
        <h2>Let's Connect 🤝</h2>
        <p>Feel free to reach out for collaborations or just a friendly chat.</p>

        <div className="contact-links-grid">
            <a href={`mailto:${email}`} className="contact-card">
                <MdEmail className="contact-icon" />
                <div>
                    <span className="label">Email Me</span>
                    <span className="value">{email}</span>
                </div>
            </a>

            <a href={`tel:${phoneNo}`} className="contact-card">
                <MdPhone className="contact-icon" />
                <div>
                    <span className="label">Call Me</span>
                    <span className="value">{phoneNo}</span>
                </div>
            </a>

            <a 
                href={`https://wa.me/${whatsappNo}`} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="contact-card whatsapp-card"
            >
                <IoLogoWhatsapp className="contact-icon" />
                <div>
                    <span className="label">WhatsApp Chat</span>
                    <span className="value">Click to start</span>
                </div>
            </a>
        </div>

        <div className="footer-bottom">
          <p>© {currentYear} Raghvendra.cloud. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
