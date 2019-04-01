const THUMBNAILICONSIZE = 24;

export const SelectionButtonStyles = {
  thumbnailSelectionIcon: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'transparent',
  },
  fullScreenSelectionIcon: {
    position: 'absolute',
    top: 60,
    right: 16,
    backgroundColor: 'transparent',
  },
  videoIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbnailSelectedNum: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: THUMBNAILICONSIZE,
    height: THUMBNAILICONSIZE,
    borderRadius: THUMBNAILICONSIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'green',
    overflow: 'hidden',
  },
  selectedNumText: {
    color: 'white',
  },
  fullScreenSelectedNum: {
    position: 'absolute',
    top: 60,
    right: 16,
    width: THUMBNAILICONSIZE,
    height: THUMBNAILICONSIZE,
    borderRadius: THUMBNAILICONSIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'green',
    overflow: 'hidden',
  },
}
