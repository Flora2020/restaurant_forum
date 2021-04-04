'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.removeConstraint('Comments', 'comments_ibfk_2')
  },

  down: async (queryInterface, Sequelize) => {
    const options = {
      type: 'foreign key',
      name: 'comments_ibfk_2',
      fields: ['RestaurantId'],
      references: {
        table: 'Restaurants',
        field: 'id'
      }
    }
    await queryInterface.addConstraint('Comments', options)
  }
}
