import { faker, simpleFaker } from "@faker-js/faker";
import { User } from "../models/user.model.js";
import { Chat } from "../models/chat.model.js";

const createUser = async (numUsers) => {
  try {
    const userPromise = [];
    for (let i = 0; i < numUsers; i++) {
      const tempUser = User.create({
        name: faker.person.fullName(),
        username: faker.internet.userName(),
        bio: faker.lorem.sentence(10),
        password: "password",
        avatar: {
          url: faker.image.avatar(),
          public_id: faker.system.fileName(),
        },
      });
      userPromise.push(tempUser);
    }
    await Promise.all(userPromise);
    console.log("Users Created", numUsers);
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};

const createSingleChats = async (chatCount) => {
  try {
    const users = await User.find().select("_id");

    const chatPromise = [];
    for (let i = 0; i < users.length; i++) {
      for (let j = i + 1; j < users.length; j++) {
        Chat.Promise.push(
          Chat.create({
            name: faker.lorem.words(2),
            members: [users[i], users[j]],
          })
        );
      }
      await Promise.all(chatPromise);

      console.log("Chats created successfully");
      promise.exit();
    }
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

const creatGroupMessages = async (numChats) => {
  try {
    const users = await User.find().select("_id");

    const chatPromise = [];
    for (let i = 0; i < numChats; i++) {
      const numMembers = simpleFaker.number.int({ min: 3, max: users.length });
      const members = [];

      for (let j = 0; j < numMembers; j++) {
        const randomIndex = Math.floor(Math.random() * users.length);
        const randomUser = users[randomIndex];
        if (!members.includes(randomUser)) members.push(randomUser);
      }
    const chat = Chat.create({
      groupChat: true,
      name: faker.lorem.words(1),
      members,
      creator: members[0],
    });
    chatPromise.push(chat);
}

    

    await Promise.all(chatPromise);

    console.log("Chats created successfully");
    promise.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

export { createUser };
