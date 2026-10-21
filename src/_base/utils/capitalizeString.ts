type CapitalizeString = (name: string) => string;

export const capitalizeString: CapitalizeString = (name) => {
return name.split(' ').map(s =>  `${s.slice(0, 1).toUpperCase()}${s.slice(1, s.length).toLowerCase()}`).join(' ')
}
