// Simple CAPTCHA utility
export const generateCaptcha = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let captcha = '';
    for (let i = 0; i < 6; i++) {
        captcha += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return captcha;
};

export const generateCaptchaImage = (captcha) => {
    const canvas = document.createElement('canvas');
    canvas.width = 150;
    canvas.height = 50;
    
    const ctx = canvas.getContext('2d');
    
    // Background
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add noise lines
    for (let i = 0; i < 3; i++) {
        ctx.strokeStyle = '#ddd';
        ctx.beginPath();
        ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
        ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
        ctx.stroke();
    }
    
    // Add text
    ctx.fillStyle = '#0066b3';
    ctx.font = 'bold 30px Arial';
    ctx.textBaseline = 'middle';
    
    for (let i = 0; i < captcha.length; i++) {
        const x = 15 + i * 20;
        const y = canvas.height / 2;
        const angle = (Math.random() - 0.5) * 0.3;
        
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);
        ctx.fillText(captcha[i], 0, 0);
        ctx.restore();
    }
    
    return canvas.toDataURL();
};
