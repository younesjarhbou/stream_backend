const mongoose = require("mongoose");

const settingSchema = new mongoose.Schema(
  {
    googlePayId: { type: String, default: "GOOGLE PAY ID" },
    googlePaySwitch: { type: Boolean, default: false },
    stripeId: { type: String, default: "PAYPAL ID" },
    stripeSwitch: { type: Boolean, default: false },
    razorPayId: { type: String, default: "RAZOR PAY ID" },
    razorPaySwitch: { type: Boolean, default: false },
    agoraId: String,
    hostCharge: { type: Number, default: 0 },
    policyLink: String,
    loginBonus: { type: Number, default: 0 },
    redeemGateway: { type: String, default: "Paypal" },
    minPoints: { type: Number, default: 200 },
    currency: { type: String, default: "USD" },
    howManyCoins: { type: Number, default: 2000 },
    toCurrency: { type: Number, default: 1 },
    userCallCharge: { type: Number, default: 0 },
    userLiveStreamingCharge: { type: Number, default: 0 },
    streamingMinValue: { type: Number, default: 0 },
    streamingMaxValue: { type: Number, default: 200 },
    dailyTaskMinValue: { type: Number, default: 50 },
    dailyTaskMaxValue: { type: Number, default: 200 },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Setting", settingSchema);
