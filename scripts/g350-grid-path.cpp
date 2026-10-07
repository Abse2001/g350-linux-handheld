#include <algorithm>
#include <chrono>
#include <cmath>
#include <cstdint>
#include <fstream>
#include <iostream>
#include <queue>
#include <sstream>
#include <vector>
// Candidate search only. Continuous geometry and native/KiCad checks decide acceptance.
struct Node { float f, g; int id; bool operator<(const Node& n) const {return f>n.f;} };
int main(int argc,char**argv){
 if(argc<10 || argc>14)return 2;
 int w=std::stoi(argv[1]),h=std::stoi(argv[2]),sx=std::stoi(argv[3]),sy=std::stoi(argv[4]),sl=std::stoi(argv[5]);
 int plane=w*h,n=plane*4;bool prefer_inner=argc>=12&&std::stoi(argv[11])==1;
 std::vector<uint8_t> blocked(n),via(plane),goal(n),penalty(n,0);
 if(argc>=13 && std::string(argv[12])!="-"){std::ifstream f(argv[12],std::ios::binary);f.read((char*)penalty.data(),penalty.size());if(!f)return 3;}
 const float via_cost=argc==14?std::stof(argv[13]):30.f;
 if(via_cost<=0)return 2;
 for(auto pair:{std::make_pair(argv[6],&blocked),std::make_pair(argv[7],&via),std::make_pair(argv[8],&goal)}){
  std::ifstream f(pair.first,std::ios::binary);f.read((char*)pair.second->data(),pair.second->size());if(!f)return 3;
 }
 int start=sl*plane+sy*w+sx;if(blocked[start]){std::cout<<"BLOCKED\n";return 0;}
 std::vector<int> gx,gy; for(int i=0;i<n;i++)if(goal[i]){gx.push_back(i%w);gy.push_back((i%plane)/w);}
 if(gx.empty()){std::cout<<"NO_GOAL\n";return 0;}
 // Obstacle-free octile distance to the actual goal union, not its bounding box.
 // A bounding box is a poor lower bound when a net spans the board.
 std::vector<float> distance(plane,INFINITY);
 for(int i=0;i<n;i++)if(goal[i])distance[i%plane]=0;
 for(int y=0;y<h;y++)for(int x=0;x<w;x++){
  int i=y*w+x;
  if(x)distance[i]=std::min(distance[i],distance[i-1]+1);
  if(y)distance[i]=std::min(distance[i],distance[i-w]+1);
  if(x&&y)distance[i]=std::min(distance[i],distance[i-w-1]+1.41421356f);
  if(x+1<w&&y)distance[i]=std::min(distance[i],distance[i-w+1]+1.41421356f);
 }
 for(int y=h-1;y>=0;y--)for(int x=w-1;x>=0;x--){
  int i=y*w+x;
  if(x+1<w)distance[i]=std::min(distance[i],distance[i+1]+1);
  if(y+1<h)distance[i]=std::min(distance[i],distance[i+w]+1);
  if(x&&y+1<h)distance[i]=std::min(distance[i],distance[i+w-1]+1.41421356f);
  if(x+1<w&&y+1<h)distance[i]=std::min(distance[i],distance[i+w+1]+1.41421356f);
 }
 auto heuristic=[&](int x,int y){return distance[y*w+x];};
 std::vector<float> cost(n,INFINITY);std::vector<int> parent(n,-1);std::priority_queue<Node> open;
 std::vector<int> starts{start};
 if(argc>=11){starts.clear();std::stringstream input(argv[10]);std::string item;while(std::getline(input,item,','))starts.push_back(std::stoi(item));}
 for(int id:starts)if(id>=0&&id<n&&!blocked[id]){cost[id]=0;open.push({heuristic(id%w,(id%plane)/w),0,id});}int end=-1,expanded=0;auto begun=std::chrono::steady_clock::now();
 while(!open.empty()){
  auto node=open.top();open.pop();if(node.g!=cost[node.id])continue;
  if(goal[node.id]){end=node.id;break;}
  if(++expanded%10000==0 && (expanded>std::max(3000000,n/2) || std::chrono::steady_clock::now()-begun>std::chrono::seconds(std::stoi(argv[9]))))break;
  int layer=node.id/plane,xy=node.id%plane,x=xy%w,y=xy/w;
  auto offer=[&](int id,float edge){float next=node.g+edge*(prefer_inner&&(id/plane==0||id/plane==3)?1.15f:1.f)+penalty[id];if(!blocked[id]&&next<cost[id]){cost[id]=next;parent[id]=node.id;open.push({next+heuristic(id%w,(id%plane)/w),next,id});}};
  for(int dy=-1;dy<=1;dy++)for(int dx=-1;dx<=1;dx++){
   if((dx==0&&dy==0)||x+dx<0||x+dx>=w||y+dy<0||y+dy>=h)continue;
   if(dx&&dy&&(blocked[layer*plane+y*w+x+dx]||blocked[layer*plane+(y+dy)*w+x]))continue;
   offer(layer*plane+(y+dy)*w+x+dx,dx&&dy?1.41421356f:1.f);
  }
  if(via[xy])for(int l=0;l<4;l++)if(l!=layer)offer(l*plane+xy,via_cost);
 }
 if(end<0){std::cout<<"NO_PATH "<<expanded<<"\n";return 0;}
 std::vector<int> path;for(int id=end;id>=0;id=parent[id])path.push_back(id);std::reverse(path.begin(),path.end());
 std::cout<<"PATH "<<expanded<<" "<<cost[end]<<"\n";for(int id:path)std::cout<<id<<" ";std::cout<<"\n";
}
