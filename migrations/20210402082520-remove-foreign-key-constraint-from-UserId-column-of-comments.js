'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.removeConstraint('Comments', 'comments_ibfk_1')
  },

  down: async (queryInterface, Sequelize) => {
    const options = {
      type: 'foreign key',
      name: 'comments_ibfk_1',
      fields: ['UserId'],
      references: {
        table: 'Users',
        field: 'id'
      }
    }
    await queryInterface.addConstraint('Comments', options)
  }
}
