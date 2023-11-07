import Image from "next/image";

const Heroes = () => {
    return ( 
        <div className="flex flex-col items-center justify-center max-w-5xl">
            <div className="flex items-center">
                <div className="relative w-[300px] h-[300px] sm:w-[350px] sm:h-[350px] md:h-[400px] md:w-[400px]">
                    <Image
                        src={"/documents.webp"}
                        alt="Documents"
                        className="object-contain dark:hidden"
                        fill
                    />
                    <Image
                        src={"/documents-dark.webp"}
                        alt="Documents"
                        className="object-contain hidden dark:block"
                        fill
                    />
                </div>
                <div className="relative h-[400px] w-[400px] md:block hidden">
                    <Image
                        src={"/reading.webp"}
                        alt="Reading"
                        className="object-contain dark:hidden"
                        fill
                    />  
                    <Image
                        src={"/reading-dark.webp"}
                        alt="Reading"
                        className="object-contain hidden dark:block"
                        fill
                    />    
                </div>
            </div>
        </div>
     );
}
 
export default Heroes;