const { Book , User } = require('../models');
const { signToken, AuthenticationError } = require('../utils/auth');

const resolvers = {
  Query: {
    me: async (parent, args, context) => {
      if (context.user) {
        const payload = await User.findOne({ _id: context.user._id }).select('-__v -password')
        return payload;
      }
      throw AuthenticationError;
    },
  },
  Mutation: {
    // Takes in email and password as parameters and returns an Auth type.
    login: async (parent, { email, password }) => {
        const user = await User.findOne({ email });

        if (!user) {
            throw AuthenticationError;
        }

        const correctPw = await user.isCorrectPassword(password);

        if (!correctPw) {
            throw AuthenticationError;
        }

        const token = signToken(user);

        return { token, user };
    },
    // Adds user to database and returns an Auth type. Takes in username, email, and password as parameters.
    addUser: async (parent, { username, email, password }) => {
        const user = await User.create({ username, email, password });
        const token = signToken(user);
        return { token, user };
    },
    // Takes in book author, description, title, bookId, image, and link as parameters and returns a User type.
    saveBook: async (parent, { bookData }, context) => {
        if (context.user) {
            const updatedUser = await User.findByIdAndUpdate(
                { _id: context.user._id },
                { $push: { savedBooks: bookData } },
                { new: true, runValidators: true }
            );
            return updatedUser;
        }
        throw AuthenticationError;
    },
    // removes book from user and returns a User type. Takes in bookId as a parameter.
    removeBook: async (parent, { bookId }, context) => {
        if (context.user){
            const updatedUser = await User.findOneAndUpdate(
                { _id: context.user._id },
                { $pull: { savedBooks: { bookId } } },
                { new: true }
            );
            return updatedUser;
        }
        throw AuthenticationError;
    },
  },
};

module.exports = resolvers;