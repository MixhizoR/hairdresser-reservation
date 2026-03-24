const isValidPhone = (phone) => /^05\d{9}$/.test(phone);

const isValidName = (name) => {
    const t = name?.trim() || '';
    return t.length >= 2 && t.length <= 50 && /^[a-zA-ZğüşıöçĞÜŞİÖÇ\s&]+$/.test(t);
};

module.exports = {
    isValidPhone,
    isValidName,
};
