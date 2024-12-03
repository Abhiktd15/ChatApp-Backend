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

export { createUser };
