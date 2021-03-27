'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('Users', 'email', {
      allowNull: true,
      type: Sequelize.STRING
    })

    await queryInterface.changeColumn('Users', 'password', {
      allowNull: true,
      type: Sequelize.STRING
    })
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('Users', 'email', {
      allowNull: false,
      type: Sequelize.STRING
    })

    await queryInterface.changeColumn('Users', 'password', {
      allowNull: false,
      type: Sequelize.STRING
    })
  }
}
