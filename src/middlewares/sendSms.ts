import axios from "axios";
export const sendOTP = async (mobile, otp) => {
    try {
        const response = await axios.post("https://api.msg91.com/api/v5/otp", {
            template_id: process.env.MSG91_OTP_TEMPLATE_ID,
            authkey: process.env.MSG91_AUTH_KEY,
            mobile: `91${mobile}`,
            otp,
        });
        return response.data;
    }
    catch (error) {
        const axiosError = error;
        console.error("MSG91 OTP Error:", axiosError.response?.data || axiosError.message);
        // throw new Error("Failed to send OTP");
    }
};
