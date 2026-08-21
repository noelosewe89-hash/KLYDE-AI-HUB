export default async function handler(req, res) {

    const keys = Object.keys(process.env);

    return res.status(200).json({
        success: true,
        sportmonks_key_exists:
            keys.includes("SPORTMONKS_API_KEY"),
        message:
            "KLYDE environment test"
    });

}
