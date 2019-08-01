const actual = require('./api');

async function run() {
  let accounts = await actual.getAccounts();
  let categories = await actual.getCategories({ asList: true });
  let payees = await actual.getPayees();

  console.log(JSON.stringify(await actual.getBudgetMonth('2019-07'), null, 2));
}

actual.runWithBudget('user1', run);
