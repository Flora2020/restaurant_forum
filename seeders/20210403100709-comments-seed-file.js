'use strict'
const faker = require('faker')
const userSeedNumber = 3
const restaurantSeedNumber = 50

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('Comments',
      Array.from({ length: 10 }).map((comment, index) => ({
        id: index + 1,
        text: faker.lorem.sentence(),
        UserId: Math.floor(Math.random() * userSeedNumber) + 1,
        RestaurantId: Math.floor(Math.random() * restaurantSeedNumber) + 1,
        createdAt: new Date(),
        updatedAt: new Date()
      })), {})
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('Comments', null, {})
  }
}
