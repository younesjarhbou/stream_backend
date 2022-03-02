const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    name: String,
    image: String,
    username: String,
    identity: String,
    bio: { type: String, default: null },
    coin: { type: Number, default: 0 },
    followers_count: { type: Number, default: 0 },
    following_count: { type: Number, default: 0 },
    fcm_token: String,
    block: { type: Boolean, default: false },
    country: String,
    dailyTaskDate: { type: String },
    dailyTaskFinishedCount: { type: Number, default: 0 },
    rate: { type: Number, default: 0 },
    isLogout: { type: Boolean, default: false },
    isVIP: { type: Boolean, default: false },
    plan_id: { type: mongoose.Schema.Types.ObjectId, default: null },
    plan_start_date: { type: String, default: null },
    thumbImage: String,
    isOnline: { type: Boolean, default: false },
    isLive: { type: Boolean, default: false },
    isBusy: { type: Boolean, default: false },
    isHost: { type: Boolean, default: false },
    token: { type: String, default: null },
    channel: { type: String, default: null },
    hostCountry: { type: mongoose.Schema.Types.ObjectId, ref: "Country" },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", UserSchema);
