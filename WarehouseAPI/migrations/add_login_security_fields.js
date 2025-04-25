// Migration to add failed login attempts and last failed login time fields
export async function up(queryInterface, Sequelize) {
  return queryInterface.sequelize.transaction(async (transaction) => {
    // Add failedLoginAttempts column
    await queryInterface.addColumn(
      'users',
      'failedLoginAttempts',
      {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false
      },
      { transaction }
    );

    // Add lastFailedLoginAt column
    await queryInterface.addColumn(
      'users',
      'lastFailedLoginAt',
      {
        type: Sequelize.DATE,
        allowNull: true
      },
      { transaction }
    );
  });
}

export async function down(queryInterface, Sequelize) {
  return queryInterface.sequelize.transaction(async (transaction) => {
    // Remove columns
    await queryInterface.removeColumn('users', 'failedLoginAttempts', { transaction });
    await queryInterface.removeColumn('users', 'lastFailedLoginAt', { transaction });
  });
} 