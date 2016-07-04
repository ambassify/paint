import autoprefixer from 'autoprefixer';
import postcss from 'postcss';

const modernBrowsers = autoprefixer({
    browsers: ['last 3 versions', 'iOS >= 8', 'not ie <= 10']
});

export default function autoprefix(css) {
    return postcss([ modernBrowsers ])
        .process(css)
        .then(res => res.css);
};
