import userPreferences from './userPreferences';

// Mock MMKVStorage
const mockMMKVInstance = {
  getString: jest.fn(),
  setString: jest.fn(),
  getBool: jest.fn(),
  setBool: jest.fn(),
  getMap: jest.fn(),
  setMap: jest.fn(),
  removeItem: jest.fn(),
  clearStore: jest.fn(), // Added for completeness, not strictly required by tests
  encrypt: jest.fn(),
  decrypt: jest.fn(),
  clearMemoryCache: jest.fn()
};

jest.mock('react-native-mmkv-storage', () => {
  const originalModule = jest.requireActual('react-native-mmkv-storage');
  return {
    ...originalModule,
    MMKVLoader: jest.fn().mockImplementation(() => ({
      setProcessingMode: jest.fn().mockReturnThis(),
      setAccessibleIOS: jest.fn().mockReturnThis(),
      withEncryption: jest.fn().mockReturnThis(),
      initialize: jest.fn().mockReturnValue(mockMMKVInstance),
    })),
  };
});

describe('UserPreferences', () => {
  beforeEach(() => {
    // Reset mocks before each test
    mockMMKVInstance.getString.mockReset();
    mockMMKVInstance.setString.mockReset();
    mockMMKVInstance.getBool.mockReset();
    mockMMKVInstance.setBool.mockReset();
    mockMMKVInstance.getMap.mockReset();
    mockMMKVInstance.setMap.mockReset();
    mockMMKVInstance.removeItem.mockReset();
  });

  describe('getString', () => {
    const testKey = 'testGetStringKey';
    const testValue = 'testValue';

    it('should return the value from mmkv.getString', () => {
      mockMMKVInstance.getString.mockReturnValue(testValue);
      expect(userPreferences.getString(testKey)).toBe(testValue);
      expect(mockMMKVInstance.getString).toHaveBeenCalledWith(testKey);
    });

    it('should return null if mmkv.getString returns undefined (or null)', () => {
      mockMMKVInstance.getString.mockReturnValue(null);
      expect(userPreferences.getString(testKey)).toBeNull();
      mockMMKVInstance.getString.mockReturnValue(undefined);
      expect(userPreferences.getString(testKey)).toBeNull();
    });

    it('should return null if mmkv.getString throws an error', () => {
      mockMMKVInstance.getString.mockImplementation(() => {
        throw new Error('MMKV Error');
      });
      expect(userPreferences.getString(testKey)).toBeNull();
    });
  });

  describe('setString', () => {
    const testKey = 'testSetStringKey';
    const testValue = 'testSetValue';

    it('should call mmkv.setString with the key and value', () => {
      userPreferences.setString(testKey, testValue);
      expect(mockMMKVInstance.setString).toHaveBeenCalledWith(testKey, testValue);
    });

    it('should return the result of mmkv.setString', () => {
      mockMMKVInstance.setString.mockReturnValue(true);
      expect(userPreferences.setString(testKey, testValue)).toBe(true);
      mockMMKVInstance.setString.mockReturnValue(false); // MMKV setString actually returns void, but the wrapper might change this
      expect(userPreferences.setString(testKey, testValue)).toBe(false);
    });
  });

  // Similar tests for getBool, setBool, getMap, setMap

  describe('getBool', () => {
    const testKey = 'testGetBoolKey';
    it('should return value from mmkv.getBool', () => {
      mockMMKVInstance.getBool.mockReturnValue(true);
      expect(userPreferences.getBool(testKey)).toBe(true);
      expect(mockMMKVInstance.getBool).toHaveBeenCalledWith(testKey);
    });
    it('should return null if mmkv.getBool throws', () => {
      mockMMKVInstance.getBool.mockImplementation(() => { throw new Error('Error'); });
      expect(userPreferences.getBool(testKey)).toBeNull();
    });
  });

  describe('setBool', () => {
    const testKey = 'testSetBoolKey';
    it('should call mmkv.setBool', () => {
      userPreferences.setBool(testKey, true);
      expect(mockMMKVInstance.setBool).toHaveBeenCalledWith(testKey, true);
    });
  });

  describe('getMap', () => {
    const testKey = 'testGetMapKey';
    const testObj = { a: 1 };
    it('should return value from mmkv.getMap', () => {
      mockMMKVInstance.getMap.mockReturnValue(testObj);
      expect(userPreferences.getMap(testKey)).toEqual(testObj);
      expect(mockMMKVInstance.getMap).toHaveBeenCalledWith(testKey);
    });
    it('should return null if mmkv.getMap throws', () => {
      mockMMKVInstance.getMap.mockImplementation(() => { throw new Error('Error'); });
      expect(userPreferences.getMap(testKey)).toBeNull();
    });
  });

  describe('setMap', () => {
    const testKey = 'testSetMapKey';
    const testObj = { b: 2 };
    it('should call mmkv.setMap', () => {
      userPreferences.setMap(testKey, testObj);
      expect(mockMMKVInstance.setMap).toHaveBeenCalledWith(testKey, testObj);
    });
  });

  describe('removeItem', () => {
    const testKey = 'testRemoveItemKey';

    beforeEach(() => {
      // Ensure getString is reset for each removeItem test, as it's called internally
      mockMMKVInstance.getString.mockReset();
      mockMMKVInstance.removeItem.mockReset();
    });

    it('should call mmkv.removeItem and return its result if the key exists', () => {
      mockMMKVInstance.getString.mockReturnValue('some value'); // Key exists
      mockMMKVInstance.removeItem.mockReturnValue(true); // MMKV removal succeeds

      expect(userPreferences.removeItem(testKey)).toBe(true);
      expect(mockMMKVInstance.getString).toHaveBeenCalledWith(testKey);
      expect(mockMMKVInstance.removeItem).toHaveBeenCalledWith(testKey);
    });

    it('should call mmkv.removeItem and return undefined if key exists and mmkv.removeItem returns undefined', () => {
      mockMMKVInstance.getString.mockReturnValue('some value'); // Key exists
      mockMMKVInstance.removeItem.mockReturnValue(undefined); // MMKV removal returns undefined

      expect(userPreferences.removeItem(testKey)).toBeUndefined();
      expect(mockMMKVInstance.getString).toHaveBeenCalledWith(testKey);
      expect(mockMMKVInstance.removeItem).toHaveBeenCalledWith(testKey);
    });

    it('should not call mmkv.removeItem and return false if the key does not exist (getString returns null)', () => {
      mockMMKVInstance.getString.mockReturnValue(null); // Key does not exist

      expect(userPreferences.removeItem(testKey)).toBe(false);
      expect(mockMMKVInstance.getString).toHaveBeenCalledWith(testKey);
      expect(mockMMKVInstance.removeItem).not.toHaveBeenCalled();
    });

    it('should not call mmkv.removeItem and return false if getString throws an error', () => {
      mockMMKVInstance.getString.mockImplementation(() => {
        throw new Error('MMKV Error during getString');
      });

      expect(userPreferences.removeItem(testKey)).toBe(false);
      expect(mockMMKVInstance.getString).toHaveBeenCalledWith(testKey);
      expect(mockMMKVInstance.removeItem).not.toHaveBeenCalled();
    });
  });
});
