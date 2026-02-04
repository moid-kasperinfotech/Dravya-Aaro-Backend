import axios from "axios";

export const sendOTP = async (mobile: string, otp: string) => {
    try {
        const response = await axios.post("https://api.msg91.com/api/v5/otp", {
            template_id: process.env.MSG91_OTP_TEMPLATE_ID,
            authkey: process.env.MSG91_AUTH_KEY,
            mobile: `91${mobile}`,
            otp,
        });
        return response.data;
    }
    catch (error: unknown) {
        if (axios.isAxiosError(error)) {
            console.error(
                "MSG91 OTP Error:",
                error.response?.data || error.message
            );
        } else if (error instanceof Error) {
            console.error("Unknown Error:", error.message);
        } else {
            console.error("Unexpected error:", error);
        }
    }
};
