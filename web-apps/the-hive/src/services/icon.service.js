export class IconService {
  load(icon_path) {
    return fetch(icon_path)
      .then((response) => response.text())
      .then((source) => {
        let fakeDOM = new DOMParser().parseFromString(source, 'image/svg+xml');
        return fakeDOM.getElementsByTagName('g')[0];
      });
  }

  loadStaticImage(image_path) {
    /*NL Nkosi 05 July 2021:
    *Should we have more than stock images, we should generate the 
    *folder from path from an enum or switch of some sort. Not doing
    *it now to avoid over-engineering the solution
    */
    return fetch(`static-content/images/stock/${image_path}`)
      .then((response) => {
        return response
          .blob()
          .then((blob) => (window.URL || window.webkitURL).createObjectURL(blob));
      })
  }

  loadStaticEventImage(image_path) {
    return fetch(`static-content/images/events/${image_path}`)
      .then((response) => {
        return response
          .blob()
          .then((blob) => (window.URL || window.webkitURL).createObjectURL(blob));
      })
  }
}

export default new IconService();


