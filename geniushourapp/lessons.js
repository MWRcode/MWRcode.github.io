import { setTitle, setEditor, newParagraph, newList, newTable, newCodeBlock, setupPython } from "code.js";

const params = new URLSearchParams(window.location.search);
const lessonNumber = params.get("lesson");

if (lessonNumber == 1) {
    setTitle("Output", 1);

    newParagraph(`Let's start off simple with simple line of Python:`);
    newCodeBlock(`print("Hello World")`);
    newParagraph(`You may not understand what all of it does yet, but you will. This program outputs the phrase, "Hello World" to the console.`);
    newParagraph(`The "print" keyword specifies a function. The parentheses specify the parameters to the function. The quotation marks specify a text input. And the input is: Hello World. Anything written in the quotation marks will be outputted when the program runs.`)
    newParagraph(`Try writing your own message!`);
} else if (lessonNumber == 2) {
    setTitle("Types", 2);

    newParagraph(`When programming you will need to use different types of data. For example:`);
    newList([`Numbers`, `Text`, `Lists`, `Booleans`]);
    newParagraph(`In Python these types are assigned based on how you write your data.`);
    newParagraph(`You already know about one type, a string. The string type contains text and is denoted by quotation marks. Strings look like this:`);
    newCodeBlock(`"This is a string!"`);
    newParagraph(`Another type you should know about is a number. A number needs no extra descriptors and is simply a number. Numbers look like this:`);
    newCodeBlock(`123`);
    newParagraph(`One more type to know is a list. A list is created with brackets and can contain multiple types of data separated by commas A list looks like this:`);
    newCodeBlock(`["This is the first item", 49, 2, "This is the last item"]`);
    newParagraph(`All of these types can be outputted or printed to the console. Try it yourself!`);
} else if (lessonNumber == 3) {
    setTitle("Variables", 3);

    newParagraph(`When assigning variables you need a name and data. Variables are assigned using the equals sign. For example, this program sets a variable named “a” to the value of 85.`);
    newCodeBlock(`a = 10`);
    newParagraph(`Variables can be assigned any type. For example:`);
    newCodeBlock(`b = "This is a string."`);
    newParagraph(`Variables can also be assigned other variables. For example:`);
    newCodeBlock(`a = 20\na = a`);
    newParagraph(`Note that variable names can be as long as you want and do not have to be single letters. Variables names can also contain letters, as long as the first character is a letter. These are both valid variable names:`);
    newCodeBlock(`Var = "Hello"\nk1 = "Hi"`);
    newParagraph(`Try writing your own variables!`);
} else if (lessonNumber == 4) {
    setTitle("Operators", 4);

    newParagraph(`Operators are simple, built-in mathematical operations that can be used on numbers. For example, this expression sets “a” to 4 + 9:`);
    newCodeBlock(`a = 4 + 9`);
    newParagraph(`The built-in operators include:`);

    newTable(["Name", "Symbol", "Operation"], [
        ["Add", "+", "Adds two numbers."],
        ["Subtract", "-", "Subtracts two numbers."],
        ["Multiply", "*", "Multiplies two numbers."],
        ["Divide", "/", "Divides two numbers."],
        ["Parentheses", "()", "Evaluates contained expressions separate from the surrounding expression."],
        ["Exponent", "**", "Raises one number to the power of another."]
    ]);

    newParagraph(`When dealing with multiple operators, Python will evaluate them in PEMDAS order. This order is:`);

    newList([
        "All expressions inside parentheses",
        "Exponents",
        "Multiplication and division from left to right",
        "Addition and subtraction from left to right"
    ], "numbered");

    newParagraph(`For example this prints 16:`);
    newCodeBlock(`print(10 + 3 * 4 / (0.5 + 1.5))`);
    newParagraph(`Try writing your own expressions!`);

    setEditor(`print(10 + 3 * 4 / (0.5 + 1.5))`);
} else if (lessonNumber == 5) {
    setTitle("Booleans", 5);

    newParagraph(`Booleans are a special type that only have two values, true or false. For example, these are booleans:`);
    newCodeBlock(`a = True\nb = False`);
    newParagraph(`Booleans can be created by comparisons between values. Python includes built-in symbols for comparison, these symbols are:`);

    newTable(["Name", "Symbol", "Condition"], [
        ["Greater than", ">", "If a number is greater than another."],
        ["Less than", "<", "If a number is less than another."],
        ["Greater than or equal to", ">=", "If a number is greater than or equal to another."],
        ["Less than or equal to", ">=", "If a number is less than or equal to another."],
        ["Equal to", "==", "If a number is equal to another."],
        ["Not equal to", "!=", "If a number is unequal to another."]
    ]);

    newParagraph(`These symbols output a boolean depending on whether the statement is true or false. For example this prints true:`);
    newCodeBlock(`print(7 > 2)`);
    newParagraph(`And this prints false:`);
    newCodeBlock(`print(1 == 4)`);
    newParagraph(`Try writting your own boolean comparisons!`);
} else if (lessonNumber == 6) {
    setTitle("Boolean Logic", 6);

    newParagraph(`Single booleans are not that useful, so we combine them with boolean logic. Booleans can be combined with certain boolean logic expressions. For example:`);
    newCodeBlock(`a = 4 > 0\nb = 1 < 9\nc = a and b\nprint(c)`);
    newParagraph(`This program prints true if “a” and “b” are both true.`);
    newParagraph(`The “and” operation is an example of a built-in boolean operation. The built-in boolean operations include:`);

    newTable(["Name", "Program Name", "Operation"], [
        ["And", "and", "Returns true if both inputs are true."],
        ["Or", "or", "Returns true if at least one input is true."],
        ["Not", "not", "Returns the opposite of the input."]
    ]);

    newParagraph(`*Note that the "not" operation is special because it only takes one input.`);
    newParagraph(`For example this prints true:`);
    newCodeBlock(`a = False\nprint(not a)`);
    newParagraph(`Try writting your own boolean logic expressions!`);
} else if (lessonNumber == 7) {
    setTitle("", 7);

    newParagraph(``);
    newCodeBlock(``);
} else if (lessonNumber == 8) {
    setTitle("", 8);

    newParagraph(``);
    newCodeBlock(``);
} else if (lessonNumber == 9) {
    setTitle("", 9);

    newParagraph(``);
    newCodeBlock(``);
} else if (lessonNumber == 10) {
    setTitle("", 10);

    newParagraph(``);
    newCodeBlock(``);
} else if (lessonNumber == 11) {
    setTitle("", 11);

    newParagraph(``);
    newCodeBlock(``);
} else if (lessonNumber == 12) {
    setTitle("", 12);

    newParagraph(``);
    newCodeBlock(``);
}

setupPython();