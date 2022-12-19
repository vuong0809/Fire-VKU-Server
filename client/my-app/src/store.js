import { createStore } from 'zmp-framework/core';

const store = createStore({
  state: {
    loading: false,
    users: []
  },
  actions: {
    getUsers({ state }) {
      state.loading = true;
      setTimeout(() => {
        state.users = ['User 1', 'User 2', 'User 3', 'User 4', 'User 5'];
        state.loading = false;
      }, 3000);
    }
  },
  getters: {
    loading({ state }) {
      return state.loading;
    },
    users({ state }) {
      return state.users;
    }
  }
});

export default store;