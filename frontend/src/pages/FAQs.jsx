import React, { useState } from "react";
import "../styles/FAQs.css";

const FAQ_DATA = [
    {
        question: "What are the timings of Kochi Metro?",
        answer: "Kochi Metro operates from 6:00 AM to 10:30 PM on weekdays and weekends, with varying frequencies depending on peak and off-peak hours."
    },
    {
        question: "How can I book a ticket online?",
        answer: "You can book tickets securely using our website's 'Book Ticket' section or through the Kochi1 Mobile App. QR code tickets will be generated instantly."
    },
    {
        question: "What is Kochi1 Card and how to get it?",
        answer: "Kochi1 Card is a prepaid smart card offering discounts and seamless travel. You can apply for it at any KMRL station ticket counter with valid ID proof."
    },
    {
        question: "Are there any student or senior citizen concessions?",
        answer: "Currently, KMRL provides flat discounts for Kochi1 Card users. There are no specific separate concessions for students or senior citizens."
    },
    {
        question: "Is luggage allowed inside the metro?",
        answer: "Yes, you can carry personal baggage weighing up to 15 kg. Oversized, hazardous, or commercial items are strictly prohibited."
    },
    {
        question: "What should I do if I lose an item inside the metro?",
        answer: "If you lose something, immediately contact the Station Master at your destination or call our 24x7 Helpline at 1800-425-8022 for the 'Lost and Found' department."
    }
];

const FAQs = ({ onNavigate }) => {
    const [activeIndex, setActiveIndex] = useState(null);

    const toggleFAQ = (index) => {
        setActiveIndex(activeIndex === index ? null : index);
    };

    return (
        <div className="faq-page">
            <div className="faq-hero">
                <div className="faq-hero-content">
                    <h1>Frequently Asked Questions</h1>
                    <p>Find quick answers to common queries regarding metro services, tickets, cards, and more.</p>
                </div>
            </div>

            <div className="faq-container">
                <div className="faq-list">
                    {FAQ_DATA.map((faq, index) => (
                        <div
                            key={index}
                            className={`faq-item ${activeIndex === index ? 'active' : ''}`}
                            onClick={() => toggleFAQ(index)}
                        >
                            <div className="faq-question">
                                <h3>{faq.question}</h3>
                                <span className="faq-icon">{activeIndex === index ? "−" : "+"}</span>
                            </div>
                            <div className="faq-answer">
                                <p>{faq.answer}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="faq-footer-help">
                    <p>Still have questions?</p>
                    <button className="faq-contact-btn" onClick={() => onNavigate('help')}>Contact Support</button>
                </div>
            </div>

        </div>
    );
};

export default FAQs;
