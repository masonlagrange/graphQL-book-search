const { AuthenticationError } = require('apollo-server-express');
const { User, Book } = require('../models');
const { signToken } = require('../utils/auth');

const resolvers = {
    Query: {
        user: async (parent, { username }) => {
            return User.findOne({ username }).populate('savedBooks')
        },
        me: async (parent, args, context) => {
            if (context.user) {
                return User.findOne({ _id: context.user.id }).populate('savedBooks')
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
        saveBook: async (parent, { bookInput }, context) => {
            if (context.user) {
                return User.findOneAndUpdate(
                    { _id: context.user.id },
                    { 
                        $addToSet: {
                            savedBooks: { bookInput },
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
        removeBook: async (parent, { bookId }, context) => {
            if (context.user) {
                return User.findOneAndUpdate(
                    { _id: context.user.id },
                    { $pull: { savedBooks: bookId }},
                    {new: true}
                )
            }
            throw new AuthenticationError('You need to be logged in!')
        }
    }
}

module.exports = resolvers