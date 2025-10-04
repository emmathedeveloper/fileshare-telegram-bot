

export const MOVIE = [
    {
        step_name: "upload_movie",
        message: "Please upload the movie file.",
    },
    {
        step_name: "movie_caption",
        message: "Please provide a caption for the movie.",
    },
    {
        step_name: "movie_thumbnail",
        message: "Please upload a thumbnail for the movie (optional). Send /skip to skip this step.",
    },
    {
        step_name: "movie_confirmation",
        message: "Please confirm the movie details:\n\nCaption: {caption}\nThumbnail: {thumbnail}\n\nSend 'confirm' to proceed or 'cancel' to abort.",
    }
]

export const SERIES = [
    {
        step_name: "upload_series",
        message: "Please upload the series file.",
    },
    {
        step_name: "series_caption",
        message: "Please provide a caption for the series.",
    },
    {
        step_name: "series_thumbnail",
        message: "Please upload a thumbnail for the series (optional). Send /skip to skip this step.",
    },
    {
        step_name: "series_confirmation",
        message: "Please confirm the movie details:\n\nCaption: {caption}\nThumbnail: {thumbnail}\n\nSend 'confirm' to proceed or 'cancel' to abort.",
    }
]

const DIALOGUE_STEPS = {
    "movie": MOVIE,
    "series": SERIES,
} as Record<string, { step_name: string; message: string }[]>;

export const INITIAL_STEPS = [MOVIE[0], SERIES[0]];

export const getNextStep = (current_step: string , path: string) => {
    const steps = DIALOGUE_STEPS[path];
    if(!steps) return null;

    const currentIndex = steps.findIndex(step => step.step_name === current_step);
    if (currentIndex === -1 || currentIndex === steps.length - 1) {
        return null; // No next step
    }
    return steps[currentIndex + 1];
}

export const getStepByName = (step_name: string , path: string) => {
    const steps = DIALOGUE_STEPS[path];
    if(!steps) return null;

    return steps.find(step => step.step_name === step_name) || null;
}

export default DIALOGUE_STEPS;