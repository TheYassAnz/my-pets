// Les animations natives ne tournent pas sous jest : on neutralise le bruit.
jest.mock('react-native/src/private/animated/NativeAnimatedHelper', () => ({}), {
  virtual: true,
});
