const Host = require("./host.model");
const User = require("../user/user.model");
const Follower = require("../follower/follower.model");
const Notification = require("../notification/notification.model");
const Country = require("../country/country.model");
const { deleteFile } = require("../../util/deleteFile");
const fs = require("fs");
const shuffleArray = require("../../util/shuffle");

//FCM
var FCM = require("fcm-node");
var { serverKey } = require("../../util/serverPath");
var fcm = new FCM(serverKey);

//get list of host
exports.index = async (req, res) => {
  try {
    const host = await Host.find().populate("host_id").sort({ createdAt: -1 });

    if (!host) {
      throw new Error();
    }

    return res
      .status(200)
      .json({ status: true, message: "Success", data: host });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: false,
      error: error.message || "Server Error",
    });
  }
};

//create user request for becoming host
exports.store = async (req, res) => {
  try {
    if (!req.body)
      return res
        .status(200)
        .json({ status: false, message: "Invalid details." });
    if (!req.body.bio) {
      deleteFile(req.file);
      return res
        .status(200)
        .json({ status: false, message: "Bio is required" });
    }
    if (!req.body.user_id) {
      deleteFile(req.file);
      return res
        .status(200)
        .json({ status: false, message: "User Id is required" });
    }
    if (!req.file)
      return res
        .status(200)
        .json({ status: false, message: "please select an image" });

    const user = await User.findById(req.body.user_id);
    if (!user) {
      return res.status(200).json({ status: false, message: "User not found" });
    }

    user.thumbImage = req.file.path;
    user.bio = req.body.bio;

    await user.save();

    //check user request is exist in host collection
    const isHostExist = await Host.findOne({ host_id: req.body.user_id });
    if (isHostExist) {
      return res.status(200).json({ status: true, message: "Success" });
    }
    const host = new Host();

    host.host_id = req.body.user_id;
    await host.save();

    if (!host) {
      return res.status(200).json({
        status: false,
        message: "host not created something went wrong!",
      });
    }

    return res.status(200).json({ status: true, message: "Success" });
  } catch (error) {
    console.log(error);
    deleteFile(req.file);
    return res
      .status(500)
      .json({ status: false, error: error.message || "Server Error" });
  }
};

//accept or unAccept user request for becoming host
exports.enableDisableHost = async (req, res) => {
  try {
    const host = await Host.findById(req.params.host_id);
    if (!host) {
      return res.status(200).json({ status: false, message: "host not found" });
    }

    host.isAccepted = !host.isAccepted;
    await host.save();

    const user = await User.findById(host.host_id);

    if (!user) {
      return res.status(200).json({ status: false, message: "user not found" });
    }

    user.isHost = !user.isHost;
    await user.save();

    if (!user.isHost) {
      user.isOnline = false;
      user.isBusy = false;

      await user.save();
    }

    return res
      .status(200)
      .json({ status: true, message: "success", data: host });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ status: false, error: error.message || "server error" });
  }
};

//host is online
exports.hostIsOnline = async (req, res) => {
  try {
    if (
      req.body.user_id &&
      req.body.token &&
      req.body.channel &&
      req.body.country
    ) {
      const user = await User.findById(req.body.user_id);

      if (!user) {
        return res
          .status(200)
          .json({ status: false, message: "User not Found!" });
      }

      if (!user.isHost) {
        return res.status(200).json({
          status: false,
          message: "You are not host, Your host request is not accepted !",
        });
      }

      const country = await Country.find({
        name: req.body.country.toUpperCase(),
      });

      if (country.length === 0) {
        const country = new Country();
        country.name = req.body.country.toUpperCase();
        await country.save();
        user.hostCountry = country._id;
      } else {
        user.hostCountry = country[0]._id;
      }

      user.isOnline = true;
      user.isBusy = false;
      user.isLive = false;
      user.token = req.body.token;
      user.channel = req.body.channel;

      await user.save();

      return res.status(200).json({ status: true, message: "Success" });
    } else {
      return res
        .status(200)
        .json({ status: false, message: "Invalid Details" });
    }
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ status: false, error: error.message || "server error" });
  }
};

//host is live
exports.hostIsLive = async (req, res) => {
  try {
    if (
      req.body.user_id &&
      req.body.token &&
      req.body.channel &&
      req.body.country
    ) {
      const user = await User.findById(req.body.user_id);

      if (!user) {
        return res
          .status(200)
          .json({ status: false, message: "User not Found!" });
      }

      if (!user.isHost) {
        return res.status(200).json({
          status: false,
          message: "You are not host, Your host request is not accepted !",
        });
      }

      const country = await Country.find({
        name: req.body.country.toUpperCase(),
      });

      if (country.length === 0) {
        const country = new Country();
        country.name = req.body.country.toUpperCase();
        await country.save();
        user.hostCountry = country._id;
      } else {
        user.hostCountry = country[0]._id;
      }

      user.isOnline = false;
      user.isLive = true;
      user.token = req.body.token;
      user.channel = req.body.channel;

      await user.save();

      const followers = await Follower.find({
        to_user_id: req.body.user_id,
      }).populate("to_user_id from_user_id");

      // const image_ = await Image.findOne({ user_id: req.body.user_id });

      followers.map(async (data) => {
        const notification = new Notification();

        notification.title = `${data.to_user_id.name} is live`;
        notification.description = data.to_user_id.username;
        notification.type = "live";
        notification.image = data.to_user_id.image;
        notification.user_id = data.from_user_id._id;

        await notification.save();

        if (
          data.from_user_id.isLogout === false &&
          data.from_user_id.block === false
        ) {
          const payload = {
            to: data.from_user_id.fcm_token,
            notification: {
              body: `${data.to_user_id.name} is Live Now`,
            },
            data: {
              image: user.image,
              host_id: user._id.toString(),
              name: user.name,
              country_id: user.hostCountry.toString(),
              type: "real",
              coin: user.coin.toString(),
              token: user.token,
              channel: user.channel,
              view: "0",
              notificationType: "live",
            },
          };

          console.log(payload);

          await fcm.send(payload, function (err, response) {
            if (err) {
              console.log("Something has gone wrong!");
            } else {
              console.log("Successfully sent with response: ", response);
            }
          });
        }
      });

      return res.status(200).json({ status: true, message: "Success" });
    } else {
      return res
        .status(200)
        .json({ status: false, message: "Invalid Details" });
    }
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ status: false, error: error.message || "server error" });
  }
};

//host is offline
exports.hostIsOffline = async (req, res) => {
  try {
    if (req.query.user_id) {
      const user = await User.findById(req.query.user_id);

      if (!user) {
        return res
          .status(200)
          .json({ status: false, message: "User not Found!" });
      }

      if (!user.isHost) {
        return res.status(200).json({
          status: false,
          message: "You are not host, Your host request is not accepted !",
        });
      }

      const country = await Country.findById(user.hostCountry);

      if (country) {
        const user = await User.find({
          hostCountry: country._id,
          _id: { $ne: req.query.user_id },
        }).countDocuments();

        if (user === 0) {
          const country_ = await Country.findById(country._id);
          if (country_) {
            country_.deleteOne();
          }
        }
      }

      user.isOnline = false;
      user.isLive = false;
      user.isBusy = false;
      user.token = null;
      user.channel = null;
      user.hostCountry = null;

      await user.save();

      return res.status(200).json({ status: true, message: "Success" });
    } else {
      return res
        .status(200)
        .json({ status: false, message: "Invalid Details" });
    }
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ status: false, error: error.message || "server error" });
  }
};

//remove host from live
exports.hostIsUnLive = async (req, res) => {
  try {
    if (req.query.user_id) {
      const user = await User.findById(req.query.user_id);

      if (!user) {
        return res
          .status(200)
          .json({ status: false, message: "User not Found!" });
      }

      if (!user.isHost) {
        return res.status(200).json({
          status: false,
          message: "You are not host, Your host request is not accepted !",
        });
      }

      user.isBusy = false;
      user.isLive = false;

      await user.save();

      return res.status(200).json({ status: true, message: "Success" });
    } else {
      return res
        .status(200)
        .json({ status: false, message: "Invalid Details" });
    }
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ status: false, error: error.message || "server error" });
  }
};

//host is busy (connect call)
exports.hostIsBusy = async (req, res) => {
  try {
    if (req.query.user_id) {
      const user = await User.findById(req.query.user_id);

      if (!user) {
        return res
          .status(200)
          .json({ status: false, message: "User not Found!" });
      }

      if (!user.isOnline) {
        return res
          .status(200)
          .json({ status: false, message: "Host is not online!" });
      }

      user.isBusy = true;

      await user.save();

      return res.status(200).json({ status: true, message: "Success" });
    } else {
      return res
        .status(200)
        .json({ status: false, message: "Invalid Details" });
    }
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ status: false, error: error.message || "server error" });
  }
};

//host is free (disconnect call)
exports.hostIsFree = async (req, res) => {
  try {
    if (req.query.user_id) {
      const user = await User.findById(req.query.user_id);

      if (!user) {
        return res
          .status(200)
          .json({ status: false, message: "User not Found!" });
      }

      if (!user.isOnline) {
        return res
          .status(200)
          .json({ status: false, message: "Host is not online!" });
      }

      user.isBusy = false;

      await user.save();

      return res.status(200).json({ status: true, message: "Success" });
    } else {
      return res
        .status(200)
        .json({ status: false, message: "Invalid Details" });
    }
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ status: false, error: error.message || "server error" });
  }
};

//random host for match [android]
exports.randomHost = async (req, res) => {
  try {
    const user = await User.find({
      isOnline: true,
      isBusy: false,
      isHost: true,
    }).populate("hostCountry");

    if (!user) {
      return res
        .status(200)
        .json({ status: false, message: "User not Found!" });
    }

    const data = await user.map((user) => ({
      image: user.thumbImage,
      profile_image: user.image,
      host_id: user._id,
      name: user.name,
      country_id: user.hostCountry ? user.hostCountry._id : "",
      country_name: user.hostCountry ? user.hostCountry.name : "",
      isBusy: user.isBusy,
      rate: user.rate,
      coin: user.coin,
      token: user.token,
      channel: user.channel,
      view: 0,
    }));

    shuffleArray(data);

    return res.status(200).json({ status: true, message: "Success", data });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ status: false, error: error.message || "server error" });
  }
};
