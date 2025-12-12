package;

import sys.FileSystem;

class PostBuild {
    public static function main():Void {
        if(!FileSystem.exists('output/bin')) FileSystem.createDirectory('output/bin');
        
        final exeName = 'PsychCharToVSlice';
        
        if(FileSystem.exists('output/$exeName.exe')) {
            FileSystem.rename('output/$exeName.exe', 'output/bin/$exeName.exe');
        } else if(FileSystem.exists('output/$exeName')) {
            FileSystem.rename('output/$exeName', 'output/bin/$exeName');
        }
    }
}
