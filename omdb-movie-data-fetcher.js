class OMDbMovieDataFetcher {
  #QuickAdd; // ? QuickAdd class
  #Settings = {'OMDb API key': null};
  #inputText = '';
  #movieIMDbId = '';

  constructor(QuickAdd, Settings) {
    this.#QuickAdd = QuickAdd;
    this.#Settings = Settings;
  }

  async main() {
    try {
      await this.#processInputText();
      this.#setIMDbId();
      await this.#fetchOMDbData();
    } catch (error) {
      // eslint-disable-next-line no-undef
      new Notice(error.toString(), 5e3);
    }
  }

  #setIMDbId() {
    this.#movieIMDbId = /tt\d+/.exec(this.#inputText)?.[0] || null;
  }

  #removeIllegalCharacters(text = '') {
    return text.replace(/[\\,#%&{}/*<>$'":@?]*/g, '');
  }

  async #processInputText() {
    this.#inputText = (await this.#QuickAdd.quickAddApi.inputPrompt('Enter movie title, IMDb id / url: ')) || '';

    if (!this.#inputText) throw new Error('The input is empty!');
  }

  async #fetchOMDbData() {
    let apiResponse = {};
    if (this.#movieIMDbId) apiResponse = await this.#getByIMDBbId(this.#movieIMDbId);
    else {
      const queryResults = await this.#getByText(this.#inputText);
      const selectedItem = await this.#QuickAdd.quickAddApi.suggester(
        queryResults.map((result) => `(${result.Type}) ${result.Title} (${result.Year})`),
        queryResults,
      );
      if (!selectedItem) throw new Error('No choice selected.');
      apiResponse = await this.#getByIMDBbId(selectedItem.imdbID);
    }

    this.#QuickAdd.variables = {
      ...apiResponse,
      fileName: this.#removeIllegalCharacters(apiResponse.Title),
    };
  }

  async #getByIMDBbId(imdbId = '') {
    const response = await this.#getOMDbData({ i: imdbId });
    if (!response) throw new Error('Empty OMDb response!');
    return response;
  }

  async #getByText(query = '') {
    const response = await this.#getOMDbData({ s: query });
    if (!response.Search?.length) new Error('Empty OMDb response!');
    return response.Search;
  }

  async #getOMDbData(queryParams = {}) {
    const url = new URL('https://www.omdbapi.com/');

    Object.entries(queryParams).forEach(([key, value]) => url.searchParams.append(key, value));
    url.searchParams.append('apikey', this.#Settings['OMDb API key']);

    // eslint-disable-next-line no-undef
    const response = await request({
      url: url.href,
      method: 'GET',
      cache: 'no-cache',
      headers: { 'Content-Type': 'application/json' },
    });

    return JSON.parse(response);
  }
}

module.exports = {
  entry: (QuickAdd, Settings) => new OMDbMovieDataFetcher(QuickAdd, Settings).main(),
  settings: {
    name: 'OMDb movie data fetcher script',
    options: {
      'OMDb API key': {
        type: 'text',
        defaultValue: '',
        placeholder: 'OMDb API key',
        description: "You could generate a free api key here: https://www.omdbapi.com/apikey.aspx",
      },
    },
  },
};
