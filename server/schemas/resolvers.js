const { AuthenticationError } = require('apollo-server-express');
const { User } = require('../models');
const { signToken } = require('../utils/auth');

const resolvers = {
    Query: {
        me: async (parent, arg, context) => {
            if (context.user) {
                return User.findOne({ _id: context.user._id }).populate('savedBooks')
            }
            throw new AuthenticationError('You need to be logged in!')
        }
    },

    Mutation: {
        login: async (parent, { email, password }) => {
            const user = await User.findOne({ email })

            if(!user) {
                throw new AuthenticationError('Incorrect email or password')
            }

            const correctPw = await user.isCorrectPassword(password)

            if (!correctPw) {
                throw new AuthenticationError('Incorrect email or password')
            }

            const token = signToken(user)

            return { token, user }
        },
        addUser: async (parent, { username, email, password }) => {
            const user = await User.create({ username, email, password })
            const token = signToken(user)
            return { token, user }
        },
        saveBook: async (parent, Book, context) => {
            console.log(Book)
            if (context.user) {
                return User.findOneAndUpdate(
                    { _id: Book._id },
                    { 
                        $addToSet: {
                            savedBooks: Book.Book
                        },
                    },
                    {
                        new: true,
                        runValidators: true,
                    }
                )
            }
            throw new AuthenticationError('You need to be logged in!')
        },
        removeBook: async (parent, Id, context) => {
            if (context.user) {
                return User.findOneAndUpdate(
                    { _id: context.user._id,},
                    { $pull: { savedBooks: Id }},
                    {new: true}
                )
            }
            throw new AuthenticationError('You need to be logged in!')
        }
    }
}

module.exports = resolvers